import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';
import PreloadScene from './scenes/PreloadScene';

export default class CRTFilter extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  private time: number = 0;

  constructor(game: Phaser.Game) {
    super({
      game,
      name: 'CRTFilter',
      fragShader: `
        precision mediump float;
        uniform sampler2D uMainSampler;
        uniform float time;
        varying vec2 outTexCoord;

        void main() {
          vec2 uv = outTexCoord;
          
          // 스캔라인 효과 - 더 촘촘하게 (300.0으로 주파수 증가)
          // 0.03으로 강도 조절 (더 강하게 하려면 값을 높이세요)
          float scanLine = sin(uv.y * 504.0) * 0.01;
          
          // 옵션: 미세한 깜빡임 효과 추가
          float flicker = sin(time * 1.0) * 0.01;
          
          // 색수차 효과
          float r = texture2D(uMainSampler, vec2(uv.x + 0.003, uv.y)).r;
          float g = texture2D(uMainSampler, uv).g;
          float b = texture2D(uMainSampler, vec2(uv.x - 0.003, uv.y)).b;
          
          // 비네트 효과 (모서리 어둡게)
          float vignetteAmount = 0.2;
          float vignette = length(vec2(0.5, 0.5) - uv);
          vignette = 1.0 - vignette * vignetteAmount;
          
          vec3 col = vec3(r, g, b);
          col *= vignette;
          col += scanLine;
          col += flicker;
          
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
  }
  
  onBoot() {
    this.set1f('time', this.time);
  }
  
  onPreRender() {
    this.time += 0.01;
    this.set1f('time', this.time);
  }
}

const SCALE = 28;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 16*SCALE,
  height: 9*SCALE,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    // autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
        gravity: {
          x: 0,
          y: 0,
        },
        debug: false
    }
  },
  render: {
    pixelArt: true,
    roundPixels: true
  },
  backgroundColor: '#000000',
  parent: 'app',
  scene: [PreloadScene, GameScene, BootScene]
}

document.oncontextmenu = function() {
  return false;
}

const game = new Phaser.Game(config);
// game.events.once("ready", () => {
//   game.renderer.pipelines.addPostPipeline('CRTFilter', CRTFilter);
// })