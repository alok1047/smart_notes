import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-(--bg) flex flex-col items-center justify-center px-4">
      <DotLottieReact
        src="/animations/404.lottie"
        loop
        autoplay
        style={{ width: 320, height: 320 }}
      />
      <h1 className="mt-4 font-display text-2xl sm:text-3xl font-semibold text-(--text) tracking-tight">
        Page Not Found
      </h1>
    </div>
  );
};

export default NotFoundPage;
