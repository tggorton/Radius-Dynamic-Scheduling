interface Props {
  size?: number;
}

export const KervLogo = ({ size = 44 }: Props) => (
  <svg
    viewBox="0 0 664.11 662.9"
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    preserveAspectRatio="xMidYMid meet"
    aria-label="KERV"
  >
    <polygon fill="#e64d9b" points="331.42 0 0 331.46 0 0 331.42 0" />
    <polyline fill="#d82388" points="331.42 331.46 0 331.46 331.42 0" />
    <polygon fill="#b91d7e" points="1.19 331.48 332.65 662.9 1.19 662.9 1.19 331.48" />
    <polyline fill="#e03694" points="332.65 331.48 332.65 662.9 1.19 331.48" />
    <polygon fill="#e44c9b" points="332.65 331.48 664.11 662.9 332.65 662.9 332.65 331.48" />
    <polygon fill="#e64d9b" points="662.87 0 331.45 331.46 331.45 0 662.87 0" />
  </svg>
);
