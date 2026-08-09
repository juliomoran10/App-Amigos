const { query } = require('./pool');

async function getSwipedTargetIds(swiperId) {
  const result = await query('SELECT target_id FROM swipes WHERE swiper_id = $1', [swiperId]);
  return result.rows.map((row) => row.target_id);
}

async function findSwipe({ swiperId, targetId }) {
  const result = await query(
    'SELECT * FROM swipes WHERE swiper_id = $1 AND target_id = $2 LIMIT 1',
    [swiperId, targetId]
  );
  return result.rows[0] || null;
}

module.exports = {
  getSwipedTargetIds,
  findSwipe
};
