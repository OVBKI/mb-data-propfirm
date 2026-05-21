// Liens d'affiliation Quantara — l'user remplace les valeurs ici quand il crée ses comptes affiliés.
// Chaque firm a son lien direct vers la page d'inscription propfirm avec ?ref=quantara.
// Si une firm n'a pas de lien (null), on cache le bouton "Ouvrir un compte" plutôt que de pointer dans le vide.
//
// Convention de naming des clés : doit matcher le `name` utilisé dans :
//   - app/integrations/page.js (FIRMS[].name)
//   - components/PropfirmComparator.js (clés de PROPFIRM_RULES + FIRM_META)
// Quelques firms ont une typo "FuturesELites" en interne — on garde le mapping cohérent.

export const AFFILIATE_LINKS = {
  'Topstep': 'https://www.topstep.com/?ref=quantara',
  'Apex Trader Funding': 'https://apextraderfunding.com/?ref=quantara',
  'Lucid Trading': 'https://lucidtrading.com/?ref=quantara',
  'Take Profit Trader': 'https://takeprofittrader.com/?ref=quantara',
  'Bulenox': 'https://bulenox.com/?ref=quantara',
  'Tradeify': 'https://tradeify.co/?ref=quantara',
  'My Funded Futures': 'https://myfundedfutures.com/?ref=quantara',
  'Funded Futures Network': 'https://fundedfuturesnetwork.com/?ref=quantara',
  'FuturesELites': 'https://futureselites.com/?ref=quantara',
  'FuturesElite': 'https://futureselites.com/?ref=quantara', // alias display name
  'Phidias Propfirm': 'https://phidiaspropfirm.com/?ref=quantara',
  'Alpha Futures': 'https://alpha-futures.com/?ref=quantara',
}

export function getAffiliateLink(firmName) {
  if (!firmName) return null
  return AFFILIATE_LINKS[firmName] || null
}

// Disclaimer FTC-friendly à afficher en bas des pages qui contiennent des liens d'affiliation.
export const AFFILIATE_DISCLAIMER = 'Quantara peut percevoir une commission sur les inscriptions PropFirm via ces liens. Cela ne change rien au prix payé.'
