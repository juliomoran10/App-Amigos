require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcrypt');
const { query, pool } = require('./pool');

const SALT_ROUNDS = 10;
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

async function runMigrations() {
  const schemaSql = await fs.readFile(SCHEMA_PATH, 'utf8');
  await query(schemaSql);
}

async function seedDefaultData() {
  const users = await query('SELECT id FROM users LIMIT 1');
  if (users.rowCount > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash('Password123!', SALT_ROUNDS);

  const userData = [
    {
      username: 'juan',
      email: 'juan@test.com',
      name: 'Juan Pérez',
      bio: 'Apasionado de la tecnología y el café. Buscando hacer buenos amigos.',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500'
    },
    {
      username: 'maria',
      email: 'maria@test.com',
      name: 'María García',
      bio: 'Amante del senderismo, la fotografía y los viajes por el mundo.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500'
    },
    {
      username: 'carlos',
      email: 'carlos@test.com',
      name: 'Carlos Mendoza',
      bio: 'Desarrollador de software y gamer en tiempos libres.',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=500'
    },
    {
      username: 'ana',
      email: 'ana@test.com',
      name: 'Ana López',
      bio: 'Chef aficionada, amante del cine independiente y los perros.',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500'
    }
  ];

  const userIds = [];

  for (const data of userData) {
    const result = await query(
      `INSERT INTO users (username, email, password, display_name, bio, avatar, birth_date, verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [data.username, data.email, passwordHash, data.name, data.bio, data.avatar, null, true]
    );
    userIds.push(result.rows[0].id);
  }

  // Juan y María ya tienen un match con conversación para demo del chat
  const [u1, u2] = [userIds[0], userIds[1]].sort();
  const matchResult = await query(
    `INSERT INTO matches (user1_id, user2_id) VALUES ($1, $2) RETURNING id`,
    [u1, u2]
  );
  const matchId = matchResult.rows[0].id;

  const conversationResult = await query(
    `INSERT INTO conversations (match_id) VALUES ($1) RETURNING id`,
    [matchId]
  );
  const conversationId = conversationResult.rows[0].id;

  await query(
    `INSERT INTO messages (conversation_id, sender_id, text) VALUES ($1, $2, $3)`,
    [conversationId, u2, '¡Hola Juan! Me alegra mucho el match 🙌']
  );
  await query(
    `INSERT INTO messages (conversation_id, sender_id, text) VALUES ($1, $2, $3)`,
    [conversationId, u1, '¡Hola María! Igualmente, ¿qué tal el día?']
  );

  console.log('[db] Seed data created for FriendMatch');
}

async function initDatabase() {
  await runMigrations();
  await seedDefaultData();
}

async function closeDatabase() {
  await pool.end();
}

if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('[db] Migrations completed');
      return closeDatabase();
    })
    .catch(async (error) => {
      console.error('[db] Migration failed:', error);
      await closeDatabase();
      process.exit(1);
    });
}

module.exports = {
  initDatabase,
  closeDatabase,
  runMigrations,
  seedDefaultData
};
