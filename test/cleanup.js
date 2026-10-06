const db=require('../src/db');
const base=process.env.TEST_BASE_URL||'http://localhost:3000';

(async()=>{
  await fetch(base+'/api/disconnect',{method:'POST'}).catch(()=>{});
  const ids=['preview_viewer','preview_liker','preview_follower','ws_smoke_user','smoke_points_user','smoke_song_user','smoke_goal_user','smoke_likeathon','smoke_challenge','smoke_coinmatch','smoke_penalty','smoke_halving','smoke_drop_user'];
  const marks=ids.map(()=>'?').join(',');
  await db.pool.execute(`DELETE FROM live_events WHERE unique_id LIKE 'smoke_%' OR unique_id LIKE 'ws_smoke_%' OR unique_id LIKE 'gallery_preview_%' OR unique_id IN (${marks})`,ids);
  await db.pool.execute(`DELETE FROM viewers WHERE unique_id LIKE 'smoke_%' OR unique_id LIKE 'ws_smoke_%' OR unique_id LIKE 'gallery_preview_%' OR unique_id IN (${marks})`,ids);
  await db.pool.execute("DELETE FROM profiles WHERE name LIKE 'Smoke Profile %'");
  await db.pool.execute("DELETE FROM automation_rules WHERE name LIKE 'Smoke %' OR name LIKE 'ws-smoke-%'");
  await db.pool.execute("DELETE FROM goals WHERE name LIKE 'Smoke %'");
  await db.pool.execute("DELETE FROM chat_commands WHERE command_name='!smoke'");
  await db.pool.execute("DELETE FROM sound_alerts WHERE name='Smoke sound'");
  await db.pool.execute("DELETE FROM overlay_configs WHERE slug='smoke-overlay'");
  await db.pool.execute("DELETE FROM game_sessions WHERE JSON_UNQUOTE(settings) LIKE '%Smoke A%' OR JSON_UNQUOTE(settings) LIKE '%Smoke B%' OR JSON_UNQUOTE(settings) LIKE '%dropPoints%7%'");
  await db.pool.execute("DELETE FROM song_requests WHERE unique_id='smoke_song_user'");
  await db.pool.end();
  console.log('TikLiveTools test cleanup passed');
})().catch(error=>{console.error(error);process.exit(1)});
