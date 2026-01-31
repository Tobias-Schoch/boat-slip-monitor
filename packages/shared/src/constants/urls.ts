export const MONITORED_URLS = [
  {
    name: 'Konstanz Bootsliegeplatz',
    url: 'https://www.konstanz.de/stadt+gestalten/bauen+_+wohnen/privat+bauen/bootsliegeplatz',
    description: 'Main city of Konstanz boat slip page'
  },
  {
    name: 'Konstanz Serviceportal',
    url: 'https://www.konstanz.de/serviceportal/-/leistungen+von+a-z/neubeantragung-bootsliegeplatz-bootsliegeplaetze/vbid6001501',
    description: 'Konstanz service portal boat slip application'
  },
  {
    name: 'Service-BW Leistungen',
    url: 'https://www.service-bw.de/zufi/leistungen/6001501?plz=78467&ags=08335043',
    description: 'Baden-Württemberg service portal boat slip info'
  },
  {
    name: 'Service-BW Online Antrag',
    url: 'https://www.service-bw.de/onlineantraege/onlineantrag?processInstanceId=AZwTjGSsczqMBp3WMQZbUg',
    description: 'Baden-Württemberg online application form'
  }
] as const;

export const CRITICAL_KEYWORDS = [
  'warteliste',
  'anmeldung',
  'registrierung',
  'bewerbung',
  'antrag',
  'formular',
  'bewerben',
  'jetzt anmelden',
  'freie plätze',
  '< 50 personen',
  'verfügbar',
  'öffnung',
  'geöffnet'
] as const;

export const IMPORTANT_KEYWORDS = [
  'aktualisiert',
  'neu',
  'änderung',
  'information',
  'termin',
  'frist',
  'deadline'
] as const;
