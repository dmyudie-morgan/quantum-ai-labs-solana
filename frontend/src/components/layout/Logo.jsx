export const Logo = ({ size = 30, withText = true, testId }) => (
  <span className="flex items-center gap-2.5" data-testid={testId}>
    <img
      src="/brand/q-emblem-64.png"
      srcSet="/brand/q-emblem-64.png 1x, /brand/q-emblem-128.png 2x, /brand/q-emblem-256.png 4x"
      alt="Quantum AI Labs emblem"
      style={{ height: size, width: "auto" }}
      className="shrink-0 select-none mix-blend-screen"
      draggable="false"
    />
    {withText && <span className="text-[15px] font-medium tracking-tight text-white">Quantum AI Labs</span>}
  </span>
);
