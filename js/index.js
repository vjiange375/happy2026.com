<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>2026 新年倒计时</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      height: 100%;
      overflow: hidden;
      background: #000;
    }
    .canvas {
      display: block;
      width: 100vw;
      height: 100vh;
      touch-action: none;
    }
    .body--ready {
      opacity: 1;
    }
  </style>
</head>
<body>
  <canvas class="canvas"></canvas>

  <script>
    /*
      Shape Shifter (Mobile Optimized)
      Based on Kenneth Cachia's original
    */

    var S = {
      init: function () {
        S.Drawing.init('.canvas');
        document.body.classList.add('body--ready');

        // 手机端优化：自动全屏 + 更大字体
        S.UI.simulate('再见 2025|#countdown 3|2026|rain|新年快乐|一岁一礼|一寸欢喜|愿新年胜旧年|欢愉且胜意|万事皆可期|你好 2026');

        S.Drawing.loop(function () {
          S.Shape.render();
        });

        // 点击全屏（绕过限制）
        document.body.addEventListener('touchstart', function () {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        }, { once: true });
      }
    };

    S.Drawing = (function () {
      var canvas, context, dpr = window.devicePixelRatio || 1;

      return {
        init: function (el) {
          canvas = document.querySelector(el);
          context = canvas.getContext('2d');
          this.adjustCanvas();
          window.addEventListener('resize', () => this.adjustCanvas());
        },

        adjustCanvas: function () {
          const w = window.innerWidth;
          const h = window.innerHeight;
          canvas.width = w * dpr;
          canvas.height = h * dpr;
          canvas.style.width = w + 'px';
          canvas.style.height = h + 'px';
          context.scale(dpr, dpr);
        },

        loop: function (fn) {
          this.clearFrame();
          fn();
          requestAnimationFrame(() => this.loop(fn));
        },

        clearFrame: function () {
          context.clearRect(0, 0, canvas.width, canvas.height);
        },

        getArea: function () {
          return { w: canvas.clientWidth, h: canvas.clientHeight };
        },

        drawCircle: function (p, c) {
          context.fillStyle = c.render();
          context.beginPath();
          context.arc(p.x, p.y, p.z, 0, 2 * Math.PI);
          context.fill();
        }
      };
    }());

    S.UI = (function () {
      var sequence = [], currentAction, interval;

      function performAction(value) {
        sequence = typeof value === 'object' ? value : value.split('|');
        const step = () => {
          if (sequence.length === 0) return;
          const current = sequence.shift();
          if (current.startsWith('#countdown')) {
            const n = parseInt(current.split(' ')[1]) || 3;
            let i = n;
            const countdown = () => {
              if (i >= 0) {
                S.Shape.switchShape(S.ShapeBuilder.letter(i.toString()), true);
                i--;
                setTimeout(countdown, 1000);
              } else {
                performAction(sequence);
              }
            };
            countdown();
          } else {
            S.Shape.switchShape(S.ShapeBuilder.letter(current));
            setTimeout(step, 2000);
          }
        };
        step();
      }

      return {
        simulate: function (action) {
          performAction(action);
        }
      };
    }());

    S.Point = function (args) {
      this.x = args.x; this.y = args.y; this.z = args.z || 5; this.a = args.a || 1; this.h = args.h || 0;
    };

    S.Color = function (r, g, b, a) { this.r = r; this.g = g; this.b = b; this.a = a; };
    S.Color.prototype.render = function () {
      return `rgba(${this.r},${this.g},${this.b},${this.a})`;
    };

    S.Dot = function (x, y) {
      this.p = new S.Point({ x, y });
      this.t = new S.Point({ x, y });
      this.q = [];
      this.e = 0.12; // faster on mobile
      this.s = true;
      this.c = new S.Color(255, 255, 255, 1);
    };

    S.Dot.prototype = {
      _draw: function () {
        this.c.a = this.p.a;
        S.Drawing.drawCircle(this.p, this.c);
      },
      _moveTowards: function (n) {
        const dx = this.p.x - n.x, dy = this.p.y - n.y, d = Math.hypot(dx, dy);
        if (d <= 1) {
          if (this.p.h > 0) { this.p.h--; } else return true;
        } else {
          const e = this.e * d;
          this.p.x -= (dx / d) * e;
          this.p.y -= (dy / d) * e;
        }
        return false;
      },
      _update: function () {
        if (this._moveTowards(this.t)) {
          const p = this.q.shift();
          if (p) {
            Object.assign(this.t, p);
            this.p.h = p.h || 0;
          } else {
            this.p.x += (Math.random() - 0.5) * 10;
            this.p.y += (Math.random() - 0.5) * 10;
          }
        }
        this.p.a += (this.t.a - this.p.a) * 0.1;
        this.p.z += (this.t.z - this.p.z) * 0.1;
      },
      move: function (p) { this.q.push(p); },
      render: function () { this._update(); this._draw(); }
    };

    S.ShapeBuilder = (function () {
      const gap = 16; // 增大粒子间距，提升手机清晰度
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let fontSize = 80; // 默认字体大小（将根据屏幕动态调整）

      function fit() {
        const w = Math.floor(window.innerWidth / gap) * gap;
        const h = Math.floor(window.innerHeight / gap) * gap;
        canvas.width = w;
        canvas.height = h;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        // 动态计算最大可读字体
        fontSize = Math.min(120, Math.max(40, Math.min(w * 0.2, h * 0.25)));
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      }

      function processCanvas() {
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const dots = [];
        for (let y = 0; y < canvas.height; y += gap) {
          for (let x = 0; x < canvas.width; x += gap) {
            const i = (y * canvas.width + x) * 4;
            if (data[i + 3] > 128) dots.push(new S.Point({ x, y }));
          }
        }
        return { dots, w: canvas.width, h: canvas.height };
      }

      return {
        letter: function (text) {
          fit();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // 添加描边效果（提升黑底白字对比度）
          ctx.fillStyle = 'white';
          ctx.fillText(text, canvas.width / 2, canvas.height / 2);
          return processCanvas();
        }
      };
    }());

    S.Shape = (function () {
      let dots = [], width = 0, height = 0, cx = 0, cy = 0;

      function compensate() {
        const a = S.Drawing.getArea();
        cx = a.w / 2 - width / 2;
        cy = a.h / 2 - height / 2;
      }

      return {
        switchShape: function (n, fast) {
          width = n.w; height = n.h; compensate();
          while (dots.length < n.dots.length) {
            const a = S.Drawing.getArea();
            dots.push(new S.Dot(a.w / 2, a.h / 2));
          }

          const used = new Set();
          for (let i = 0; i < n.dots.length; i++) {
            let j;
            do { j = Math.floor(Math.random() * dots.length); }
            while (used.has(j));
            used.add(j);

            dots[j].s = true;
            dots[j].e = fast ? 0.25 : 0.12;
            dots[j].move({
              x: n.dots[i].x + cx,
              y: n.dots[i].y + cy,
              a: 1, z: 5, h: 0
            });
          }

          for (let i = 0; i < dots.length; i++) {
            if (!used.has(i)) {
              dots[i].s = false;
              dots[i].e = 0.04;
              const a = S.Drawing.getArea();
              dots[i].move({
                x: Math.random() * a.w,
                y: Math.random() * a.h,
                a: 0.2, z: 2, h: 0
              });
            }
          }
        },
        render: function () {
          for (let d of dots) d.render();
        }
      };
    }());

    S.init();
  </script>
</body>
</html>
