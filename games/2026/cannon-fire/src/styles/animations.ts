export const ANIMATION_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Pirata+One&family=IM+Fell+English&display=swap');

  @keyframes cannonfire-fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes cannonfire-slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes cannonfire-splash {
    0% { transform: scale(0); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.8; }
    100% { transform: scale(1.5); opacity: 0; }
  }

  @keyframes cannonfire-flame {
    0%, 100% { transform: scale(1); opacity: 0.9; }
    50% { transform: scale(1.15); opacity: 1; }
  }

  @keyframes cannonfire-ripple {
    0% { transform: scale(0.5); opacity: 0.8; }
    100% { transform: scale(1); opacity: 0.4; }
  }

  @keyframes cannonfire-sunkReveal {
    0% { opacity: 0; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.05); }
    100% { opacity: 1; transform: scale(1); }
  }

  @keyframes cannonfire-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  @keyframes cannonfire-gridSwap {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(0.97); }
    100% { opacity: 1; transform: scale(1); }
  }

  @keyframes cannonfire-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }

  @keyframes cannonfire-shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-4px); }
    40% { transform: translateX(4px); }
    60% { transform: translateX(-3px); }
    80% { transform: translateX(3px); }
  }
`;
