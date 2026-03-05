import { useEffect, useRef } from "react";
import { Application, Assets, BlurFilter, Sprite } from "pixi.js";
import PropTypes from "prop-types";

const PixiImageGlow = ({
  src,
  alt,
  borderPx = 10,
  blurStrength = 10,
  blurQuality = 8,
  glowSpreadPx = 0,
  glowScale = 1,
  maxResolution = 2,
  glowAlpha = 0.95,
  className = "",
}) => {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !src) return undefined;

    let isMounted = true;
    let resizeObserver;
    let app;
    let isAppInitialized = false;

    const run = async () => {
      app = new Application();
      await app.init({
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(maxResolution, window.devicePixelRatio || 1),
      });
      isAppInitialized = true;

      if (!isMounted) {
        return;
      }

      host.innerHTML = "";
      host.appendChild(app.canvas);

      const texture = await Assets.load(src);
      if (!isMounted) return;

      const blurredSprite = new Sprite(texture);
      const sharpSprite = new Sprite(texture);
      const blurFilter = new BlurFilter();
      blurFilter.strength = blurStrength;
      blurFilter.quality = blurQuality;
      blurredSprite.filters = [blurFilter];
      blurredSprite.alpha = glowAlpha;

      app.stage.addChild(blurredSprite, sharpSprite);

      const sourceWidth = texture.width || 1;
      const sourceHeight = texture.height || 1;
      const sourceRatio = sourceHeight / sourceWidth;

      const draw = () => {
        if (!isMounted || !host) return;
        const hostWidth = Math.max(1, Math.floor(host.clientWidth));
        const glowOutset = Math.max(0, borderPx);
        const contentWidth = Math.max(1, hostWidth - glowOutset * 2);
        const contentHeight = Math.max(1, Math.floor(contentWidth * sourceRatio));
        const renderHeight = Math.max(1, contentHeight + glowOutset * 2);
        const spread = Math.max(0, glowSpreadPx);
        const scale = Math.max(1, glowScale);
        const scaledWidth = contentWidth * scale;
        const scaledHeight = contentHeight * scale;
        const blurX = glowOutset - spread - (scaledWidth - contentWidth) / 2;
        const blurY = glowOutset - spread - (scaledHeight - contentHeight) / 2;

        app.renderer.resize(hostWidth, renderHeight);
        host.style.height = `${renderHeight}px`;

        blurredSprite.x = blurX;
        blurredSprite.y = blurY;
        blurredSprite.width = scaledWidth + spread * 2;
        blurredSprite.height = scaledHeight + spread * 2;

        sharpSprite.x = glowOutset;
        sharpSprite.y = glowOutset;
        sharpSprite.width = contentWidth;
        sharpSprite.height = contentHeight;
      };

      draw();
      resizeObserver = new ResizeObserver(draw);
      resizeObserver.observe(host);
    };

    run();

    return () => {
      isMounted = false;
      resizeObserver?.disconnect();
      if (app && isAppInitialized) {
        app.destroy(true, { children: true });
      }
    };
  }, [src, borderPx, blurStrength, blurQuality, glowSpreadPx, glowScale, maxResolution, glowAlpha]);

  return (
    <div className={className}>
      <img src={src} alt={alt} className="sr-only" />
      <div
        ref={hostRef}
        className="w-full"
        aria-hidden="true"
      />
    </div>
  );
};

PixiImageGlow.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  borderPx: PropTypes.number,
  blurStrength: PropTypes.number,
  blurQuality: PropTypes.number,
  glowSpreadPx: PropTypes.number,
  glowScale: PropTypes.number,
  maxResolution: PropTypes.number,
  glowAlpha: PropTypes.number,
  className: PropTypes.string,
};

PixiImageGlow.defaultProps = {
  alt: "",
  borderPx: 10,
  blurStrength: 10,
  blurQuality: 8,
  glowSpreadPx: 0,
  glowScale: 1,
  maxResolution: 2,
  glowAlpha: 0.95,
  className: "",
};

export default PixiImageGlow;