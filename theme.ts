// League-inspired palette: deep navy with Hextech gold, matching the app icon.
export const colors = {
  bg: '#0a1320',
  surface: '#101c2e',
  surfaceRaised: '#15243a',
  border: '#1f3048',
  gold: '#c8aa6e',
  goldDim: '#785a28',
  goldBright: '#f0e6d2',
  text: '#f0e6d2',
  textMuted: '#8b93a3',
  teal: '#0ac8b9', // edit-mode selection
  cooldownBorder: '#3a4556',
  overlay: 'rgba(3,8,15,0.7)',
} as const;

export const fonts = {
  display: 'Cinzel_700Bold',
  displayHeavy: 'Cinzel_900Black',
} as const;

export const radius = {
  tile: 12,
  card: 16,
  button: 10,
} as const;
