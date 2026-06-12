export interface BackgroundStyle {
  name: string;
  color: string;
  pattern: string;
  text: string;
}

export function getPatternCSS(patternName: string): Record<string, string> {
  switch (patternName) {
    case 'floral':
      return {
        backgroundImage: `radial-gradient(circle at 100% 150%, transparent 24%, rgba(225, 29, 72, 0.05) 24%, rgba(225, 29, 72, 0.05) 28%, transparent 28%, transparent),
                          radial-gradient(circle at 0% 150%, transparent 24%, rgba(225, 29, 72, 0.05) 24%, rgba(225, 29, 72, 0.05) 28%, transparent 28%, transparent)`,
        backgroundSize: '40px 40px'
      };
    case 'dots':
      return {
        backgroundImage: 'radial-gradient(rgba(79, 70, 229, 0.08) 2px, transparent 2px)',
        backgroundSize: '24px 24px'
      };
    case 'leaves':
      return {
        backgroundImage: 'linear-gradient(45deg, rgba(5, 150, 105, 0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(5, 150, 105, 0.05) 25%, transparent 25%)',
        backgroundSize: '30px 30px'
      };
    case 'stars':
      return {
        backgroundImage: 'radial-gradient(circle, rgba(14, 116, 144, 0.06) 10%, transparent 11%)',
        backgroundSize: '32px 32px'
      };
    case 'hearts':
      return {
        backgroundImage: `radial-gradient(circle, rgba(225, 29, 72, 0.04) 20%, transparent 20%),
                          radial-gradient(circle, rgba(225, 29, 72, 0.04) 20%, transparent 20%)`,
        backgroundPosition: '0 0, 15px 15px',
        backgroundSize: '30px 30px'
      };
    case 'waves':
      return {
        backgroundImage: 'radial-gradient(circle at 50% 100%, transparent 10px, rgba(5, 150, 105, 0.05) 10px, rgba(5, 150, 105, 0.05) 12px, transparent 12px)',
        backgroundSize: '20px 20px'
      };
    case 'sun':
      return {
        backgroundImage: 'radial-gradient(circle at top right, rgba(217, 119, 6, 0.06) 0%, transparent 70%)'
      };
    case 'marble':
      return {
        backgroundImage: 'linear-gradient(130deg, transparent 50%, rgba(0,0,0,0.02) 50%, rgba(0,0,0,0.02) 52%, transparent 52%)',
        backgroundSize: '100px 100px'
      };
    case 'navy':
      return {
        backgroundImage: 'radial-gradient(white 1px, transparent 0)',
        backgroundSize: '40px 40px'
      };
    case 'embers':
      return {
        backgroundImage: 'radial-gradient(circle at bottom, rgba(225, 29, 72, 0.1) 0%, transparent 80%)'
      };
    default:
      return {};
  }
}
