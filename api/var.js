const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { club1, club2 } = req.query;
  if (!club1 || !club2) return res.status(400).json({ error: 'club1 and club2 required' });

  try {
    // Get players who passed through club1
    const { data: passages1 } = await supabase
      .from('passages_indirects')
      .select('id_joueur')
      .eq('id_club', parseInt(club1));

    // Get players who passed through club2
    const { data: passages2 } = await supabase
      .from('passages_indirects')
      .select('id_joueur')
      .eq('id_club', parseInt(club2));

    if (!passages1 || !passages2) return res.json({ direct: [], indirect: [] });

    const ids1 = new Set(passages1.map(p => p.id_joueur));
    const ids2 = new Set(passages2.map(p => p.id_joueur));
    const commonIds = [...ids1].filter(id => ids2.has(id));

    if (commonIds.length === 0) return res.json({ direct: [], indirect: [] });

    // Get direct transfers between the two clubs
    const { data: directs } = await supabase
      .from('transferts_directs')
      .select('id_joueur, annee, type_transfert')
      .or(`and(id_club_depart.eq.${club1},id_club_arrivee.eq.${club2}),and(id_club_depart.eq.${club2},id_club_arrivee.eq.${club1})`);

    const directIds = new Set((directs || []).map(d => d.id_joueur));

    // Get player details
    const { data: joueurs } = await supabase
      .from('joueurs')
      .select('id_joueur, nom, photo_url')
      .in('id_joueur', commonIds);

    const joueurMap = {};
    (joueurs || []).forEach(j => { joueurMap[j.id_joueur] = j; });

    const transferMap = {};
    (directs || []).forEach(d => { transferMap[d.id_joueur] = d; });

    const direct = commonIds
      .filter(id => directIds.has(id))
      .map(id => ({
        ...joueurMap[id],
        annee: transferMap[id]?.annee,
        type: transferMap[id]?.type_transfert,
        points: 2
      }))
      .filter(j => j.nom);

    const indirect = commonIds
      .filter(id => !directIds.has(id))
      .map(id => ({ ...joueurMap[id], points: 1 }))
      .filter(j => j.nom);

    res.json({ direct, indirect });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
