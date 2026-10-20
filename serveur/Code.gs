/**
 * L'école de Jayden — serveur de synchronisation (Google Apps Script)
 * Garde la progression de l'enfant pour que téléphone, iPad et ordinateur partagent la même.
 * Déploiement : Web app — Exécuter en tant que : Moi — Accès : Tout le monde.
 * Le code famille n'est écrit que dans le projet Google, jamais dans le dépôt GitHub.
 */
const TAILLE_MORCEAU = 8000;
const CODE_FAMILLE = 'A_REMPLACER'; // remplacé par le vrai code uniquement dans le projet Google


function doGet(e) { return sortie_(traiter_(e.parameter || {}, null)); }
function doPost(e) {
  var b = {};
  try { b = JSON.parse(e.postData.contents); } catch (err) {}
  return sortie_(traiter_(b, b.data || null));
}

function traiter_(p, data) {
  var props = PropertiesService.getScriptProperties();
  var code = props.getProperty('CODE_FAMILLE') || CODE_FAMILLE;
  if (code === 'A_REMPLACER') code = null;
  if (!code || String(p.code) !== code) return { ok: false, erreur: 'code' };
  var cle = 'p_' + String(p.profil || 'enfant').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
  var verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    if (data) {
      ecrire_(props, cle, JSON.stringify(data));
      return { ok: true, enregistre: new Date().toISOString() };
    }
    var t = lire_(props, cle);
    return { ok: true, data: t ? JSON.parse(t) : null };
  } finally { verrou.releaseLock(); }
}

function ecrire_(props, cle, texte) {
  var n = Math.ceil(texte.length / TAILLE_MORCEAU), o = {};
  for (var i = 0; i < n; i++) o[cle + '_' + i] = texte.slice(i * TAILLE_MORCEAU, (i + 1) * TAILLE_MORCEAU);
  o[cle + '_n'] = String(n);
  var ancien = Number(props.getProperty(cle + '_n') || 0);
  props.setProperties(o);
  for (var j = n; j < ancien; j++) props.deleteProperty(cle + '_' + j);
}

function lire_(props, cle) {
  var n = Number(props.getProperty(cle + '_n') || 0), t = '';
  for (var i = 0; i < n; i++) t += props.getProperty(cle + '_' + i) || '';
  return t;
}

function sortie_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
