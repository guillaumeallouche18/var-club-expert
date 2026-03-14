const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const LEAGUE_MAP = {
  5: 'Ligue 1', 583: 'Ligue 1', 244: 'Ligue 1', 1041: 'Ligue 1', 1082: 'Ligue 1', 1904: 'Ligue 1', 980: 'Ligue 1',
  131: 'La Liga', 132: 'La Liga', 13: 'La Liga', 368: 'La Liga', 1049: 'La Liga', 1050: 'La Liga',
  11: 'Premier League', 985: 'Premier League', 31: 'Premier League', 631: 'Premier League', 1082: 'Premier League',
  281: 'Premier League', 148: 'Premier League', 762: 'Premier League', 1003: 'Premier League', 29: 'Premier League', 31: 'Premier League',
  506: 'Serie A', 5: 'Serie A', 12: 'Serie A', 6195: 'Serie A', 716: 'Serie A', 398: 'Serie A', 515: 'Serie A',
  27: 'Bundesliga', 16: 'Bundesliga', 15: 'Bundesliga', 1007: 'Bundesliga',
  294: 'Primeira Liga', 720: 'Primeira Liga', 336: 'Primeira Liga',
  610: 'Eredivisie', 383: 'Eredivisie',
};

const FLAG_MAP = {
  'Ligue 1': '🇫🇷', 'La Liga': '🇪🇸', 'Premier League': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Serie A': '🇮🇹', 'Bundesliga': '🇩🇪', 'Primeira Liga': '🇵🇹', 'Eredivisie': '🇳🇱'
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { data: clubs } = await supabase
      .from('clubs')
      .select('id_club, nom, flag, league')
      .order('nom');

    const enriched = (clubs || []).map(c => ({
      id: c.id_club,
      name: c.nom,
      flag: c.flag || FLAG_MAP[c.league] || '🏟️',
      league: c.league || 'Autre'
    }));

    res.json({ clubs: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
