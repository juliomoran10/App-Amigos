const { pool } = require('../db/pool');
const { getSwipedTargetIds } = require('../db/swipes');
const { sendPush } = require('./push.service');

const DIRECTIONS = ['LIKE', 'DISLIKE'];

async function getFeedProfiles(userId, limit = 20) {
  const excluded = await getSwipedTargetIds(userId);

  const result = await pool.query(
    `SELECT id, username, display_name, bio, birth_date, avatar
     FROM users
     WHERE deleted_at IS NULL AND id <> $1
       AND (($2)::uuid[] IS NULL OR NOT (id = ANY(($2)::uuid[])))
     ORDER BY RANDOM()
     LIMIT $3`,
    [userId, excluded.length ? excluded : null, limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    username: row.username,
    name: row.display_name,
    bio: row.bio,
    birthDate: row.birth_date,
    avatarUrl: row.avatar
  }));
}

async function processSwipe({ swiperId, targetId, direction }) {
  if (!DIRECTIONS.includes(direction)) {
    throw Object.assign(new Error('invalid_direction'), { status: 400 });
  }

  if (swiperId === targetId) {
    throw Object.assign(new Error('cannot_swipe_self'), { status: 400 });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO swipes (swiper_id, target_id, direction)
       VALUES ($1, $2, $3)
       ON CONFLICT (swiper_id, target_id)
       DO UPDATE SET direction = EXCLUDED.direction`,
      [swiperId, targetId, direction]
    );

    if (direction === 'DISLIKE') {
      await client.query('COMMIT');
      return { isMatch: false };
    }

    const reciprocal = await client.query(
      `SELECT * FROM swipes
       WHERE swiper_id = $1 AND target_id = $2 AND direction = 'LIKE'
       LIMIT 1`,
      [targetId, swiperId]
    );

    if (reciprocal.rowCount === 0) {
      await client.query('COMMIT');
      return { isMatch: false };
    }

    const [user1Id, user2Id] = [swiperId, targetId].sort();

    let matchResult;
    try {
      matchResult = await client.query(
        'INSERT INTO matches (user1_id, user2_id) VALUES ($1, $2) RETURNING id',
        [user1Id, user2Id]
      );
    } catch (error) {
      if (error.code === '23505') {
        matchResult = await client.query(
          'SELECT id FROM matches WHERE user1_id = $1 AND user2_id = $2 LIMIT 1',
          [user1Id, user2Id]
        );
      } else {
        throw error;
      }
    }

    const matchId = matchResult.rows[0].id;

    let conversationResult;
    try {
      conversationResult = await client.query(
        'INSERT INTO conversations (match_id) VALUES ($1) RETURNING id',
        [matchId]
      );
    } catch (error) {
      if (error.code === '23505') {
        conversationResult = await client.query(
          'SELECT id FROM conversations WHERE match_id = $1 LIMIT 1',
          [matchId]
        );
      } else {
        throw error;
      }
    }

    await client.query('COMMIT');

    const conversationId = conversationResult.rows[0].id;

    const [swiperRes, targetRes] = await Promise.all([
      pool.query('SELECT display_name FROM users WHERE id = $1', [swiperId]),
      pool.query('SELECT push_token, display_name FROM users WHERE id = $1', [targetId])
    ]);
    const swiperName = swiperRes.rows[0]?.display_name || 'Alguien';
    const targetPushToken = targetRes.rows[0]?.push_token || null;

    if (targetPushToken) {
      sendPush({
        to: targetPushToken,
        title: '¡Es un Match! 🎉',
        body: `A ${swiperName} también le gustas. Empiecen a conversar.`,
        data: {
          type: 'match',
          conversationId,
          peerName: swiperName
        }
      });
    }

    return {
      isMatch: true,
      matchId,
      conversationId
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { getFeedProfiles, processSwipe };
