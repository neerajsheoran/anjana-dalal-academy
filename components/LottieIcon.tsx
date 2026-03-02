'use client';

import Lottie from 'lottie-react';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  animationData: Record<string, any>;
  className?: string;
}

export default function LottieIcon({ animationData, className }: Props) {
  return (
    <Lottie
      animationData={animationData}
      loop
      autoplay
      className={className}
    />
  );
}
