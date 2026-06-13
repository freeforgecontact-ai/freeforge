import React, { useState } from 'react';

/**
 * KidsStoryWeaver — conte interactif à embranchements pour enfants, 100 % local.
 * L'arbre d'histoire est intégré en dur (plusieurs nœuds, 2 choix chacun,
 * plusieurs fins). L'enfant clique ses choix et l'aventure avance.
 * Bonus : lecture à voix haute via window.speechSynthesis (français).
 * Aucun réseau, aucune donnée envoyée.
 */

const HISTOIRE = {
  start: {
    texte: "Mia la petite renarde se réveille dans la forêt enneigée. Au loin, elle entend deux bruits : un ruisseau qui gazouille à gauche, et un tambour qui résonne à droite. Où va-t-elle ?",
    choix: [{ t: '💧 Suivre le ruisseau', vers: 'ruisseau' }, { t: '🥁 Suivre le tambour', vers: 'tambour' }],
  },
  ruisseau: {
    texte: "Près du ruisseau, Mia trouve un castor qui répare son barrage. « Veux-tu m'aider à porter des branches, ou préfères-tu pêcher un poisson brillant ? » demande-t-il.",
    choix: [{ t: '🪵 Aider le castor', vers: 'castor' }, { t: '🐟 Pêcher le poisson', vers: 'poisson' }],
  },
  tambour: {
    texte: "Le tambour vient d'une clairière où des lapins dansent autour d'un feu. Ils invitent Mia. « Danse avec nous, ou raconte-nous une histoire ! »",
    choix: [{ t: '💃 Danser', vers: 'danse' }, { t: '📖 Raconter une histoire', vers: 'conteuse' }],
  },
  castor: {
    texte: "Grâce à Mia, le barrage tient bon ! Le castor lui offre une clé en bois. Elle ouvre une petite porte au pied d'un arbre… et découvre un trésor de noisettes dorées !",
    fin: '🏆 Fin : Le trésor du castor',
  },
  poisson: {
    texte: "Le poisson brillant parle ! Il exauce un vœu. Mia souhaite que la forêt reste belle pour toujours. La neige scintille de mille couleurs. Quel beau cadeau pour tout le monde !",
    fin: '✨ Fin : Le vœu magique',
  },
  danse: {
    texte: "Mia danse si bien que la lune sort des nuages pour la regarder. Les lapins la nomment Reine de la Nuit. Elle s'endort heureuse sous les étoiles, le ventre plein de carottes sucrées.",
    fin: '👑 Fin : La reine de la nuit',
  },
  conteuse: {
    texte: "L'histoire de Mia est si captivante que les animaux de toute la forêt viennent l'écouter. On la surnomme la Grande Conteuse, et chaque soir d'hiver, on se réunit pour l'entendre.",
    fin: '📚 Fin : La grande conteuse',
  },
};

export default function KidsStoryWeaver({ goBack }) {
  const [nodeId, setNodeId] = useState('start');
  const [chemin, setChemin] = useState(['start']);
  const node = HISTOIRE[nodeId];
  const fini = !!node.fin;

  const aller = (vers) => { setNodeId(vers); setChemin((c) => [...c, vers]); parler(HISTOIRE[vers].texte); };
  const recommencer = () => { stop(); setNodeId('start'); setChemin(['start']); };

  const parler = (txt) => {
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(txt);
      u.lang = 'fr-CA'; u.rate = 0.95; u.pitch = 1.1;
      window.speechSynthesis.speak(u);
    } catch (e) { /* synthèse vocale indisponible : on ignore */ }
  };
  const stop = () => { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } };

  return (
    <div className="ksw">
      <style>{`
        .ksw{color:#eaf2fb;max-width:780px;margin:0 auto}
        .ksw h1{font-size:1.6rem;margin:0 0 4px}
        .ksw .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 16px}
        .ksw-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:700;cursor:pointer;font-size:.85rem;margin-bottom:14px}
        .ksw-prog{font-size:.78rem;color:#9fb6cf;margin-bottom:10px}
        .ksw-story{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:22px;font-size:1.15rem;line-height:1.6;min-height:120px}
        .ksw-fin{margin-top:14px;font-weight:800;font-size:1.3rem;color:#ffae3b;text-align:center}
        .ksw-choix{display:grid;gap:12px;margin-top:18px}
        .ksw-choix button{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:14px;padding:16px 18px;font-weight:800;font-size:1.05rem;cursor:pointer;text-align:left}
        .ksw-choix button:hover{filter:brightness(1.08)}
        .ksw-tools{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap;justify-content:center}
        .ksw-tools button{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:11px 16px;font-weight:700;cursor:pointer;font-size:.92rem}
        .ksw-tools button:hover{background:rgba(255,255,255,.14)}
        @media(max-width:760px){.ksw-story{font-size:1.05rem;padding:18px}}
      `}</style>

      {goBack && <button className="ksw-back" onClick={goBack}>← Retour</button>}
      <h1>🦊 L'aventure de Mia la renarde</h1>
      <p className="sub">Un conte interactif : choisis ton chemin ! 100 % hors-ligne.</p>

      <div className="ksw-prog">Étape {chemin.length} · {fini ? 'Histoire terminée' : 'Fais ton choix…'}</div>

      <div className="ksw-story">
        {node.texte}
        {fini && <div className="ksw-fin">{node.fin}</div>}
      </div>

      {!fini && (
        <div className="ksw-choix">
          {node.choix.map((c) => (
            <button key={c.vers} onClick={() => aller(c.vers)}>{c.t}</button>
          ))}
        </div>
      )}

      <div className="ksw-tools">
        <button onClick={() => parler(node.texte)}>🔊 Lire à voix haute</button>
        <button onClick={stop}>⏹️ Arrêter la voix</button>
        {(fini || chemin.length > 1) && <button onClick={recommencer}>🔄 Recommencer</button>}
      </div>
    </div>
  );
}
