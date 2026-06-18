/**
 * 图片编辑模块（工厂函数模式）
 * - 一键去背景（去除纯白/透明背景）
 * - 旋转 90°、左右镜像、水平/垂直翻转
 * - 轮廓强化（Sobel边缘检测叠加）
 *
 * 所有操作在浏览器本地 Canvas 完成，不上传服务器。
 * 依赖由外部注入：{ state, finishUpload, showLoader, hideLoader, showToast }
 */
(function(global) {
  'use strict';

  /**
   * 创建图片编辑模块实例
   * @param {Object} deps - 依赖注入
   * @param {Object} deps.state - 全局状态对象，必须有 imageData 属性
   * @param {Function} deps.finishUpload - 完成处理后的回调 (img, file, dataUrl)
   * @param {Function} deps.showLoader - 显示加载中 (msg)
   * @param {Function} deps.hideLoader - 隐藏加载中
   * @param {Function} deps.showToast - 显示提示 (msg, type)
   */
  function createImageEdit(deps) {
    const { state, finishUpload, showLoader, hideLoader, showToast } = deps;

    // ==================== 去背景 ====================

    function removeBackground() {
      if (!state.imageData) {
        showToast('请先上传图片', 'warn');
        return;
      }

      showLoader('正在去除背景…');
      setTimeout(() => {
        try {
          const img = state.imageData;
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const whiteThreshold = 240;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold) {
              data[i + 3] = 0;
            }
          }

          ctx.putImageData(imageData, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');

          const newImg = new Image();
          newImg.onload = function() {
            finishUpload(newImg, { name: '(去背景).png' }, dataUrl);
          };
          newImg.src = dataUrl;
        } catch (err) {
          hideLoader();
          console.error('去背景失败：', err);
          showToast('去背景处理失败，请重试', 'error');
        }
      }, 50);
    }

    // ==================== 旋转 90° ====================

    function rotateImage(degrees) {
      if (!state.imageData) {
        showToast('请先上传图片', 'warn');
        return;
      }

      showLoader('正在旋转图片…');
      setTimeout(() => {
        try {
          const img = state.imageData;
          const is90 = (degrees === 90 || degrees === -90);

          const newW = is90 ? img.naturalHeight : img.naturalWidth;
          const newH = is90 ? img.naturalWidth : img.naturalHeight;

          const canvas = document.createElement('canvas');
          canvas.width = newW;
          canvas.height = newH;
          const ctx = canvas.getContext('2d');

          ctx.translate(newW / 2, newH / 2);
          ctx.rotate(degrees * Math.PI / 180);
          ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

          const dataUrl = canvas.toDataURL('image/png');

          const newImg = new Image();
          newImg.onload = function() {
            finishUpload(newImg, { name: '(旋转).png' }, dataUrl);
          };
          newImg.src = dataUrl;
        } catch (err) {
          hideLoader();
          console.error('旋转失败：', err);
          showToast('旋转处理失败，请重试', 'error');
        }
      }, 50);
    }

    function rotateCW() { rotateImage(90); }
    function rotateCCW() { rotateImage(-90); }

    // ==================== 镜像与翻转 ====================

    function flipHorizontal() {
      if (!state.imageData) {
        showToast('请先上传图片', 'warn');
        return;
      }

      showLoader('正在水平翻转…');
      setTimeout(() => {
        try {
          const img = state.imageData;
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');

          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0);

          const dataUrl = canvas.toDataURL('image/png');

          const newImg = new Image();
          newImg.onload = function() {
            finishUpload(newImg, { name: '(水平翻转).png' }, dataUrl);
          };
          newImg.src = dataUrl;
        } catch (err) {
          hideLoader();
          console.error('水平翻转失败：', err);
          showToast('水平翻转失败，请重试', 'error');
        }
      }, 50);
    }

    function flipVertical() {
      if (!state.imageData) {
        showToast('请先上传图片', 'warn');
        return;
      }

      showLoader('正在垂直翻转…');
      setTimeout(() => {
        try {
          const img = state.imageData;
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');

          ctx.translate(0, canvas.height);
          ctx.scale(1, -1);
          ctx.drawImage(img, 0, 0);

          const dataUrl = canvas.toDataURL('image/png');

          const newImg = new Image();
          newImg.onload = function() {
            finishUpload(newImg, { name: '(垂直翻转).png' }, dataUrl);
          };
          newImg.src = dataUrl;
        } catch (err) {
          hideLoader();
          console.error('垂直翻转失败：', err);
          showToast('垂直翻转失败，请重试', 'error');
        }
      }, 50);
    }

    // ==================== 轮廓强化 ====================

    function enhanceEdge() {
      if (!state.imageData) {
        showToast('请先上传图片', 'warn');
        return;
      }

      showLoader('正在强化轮廓…');
      setTimeout(() => {
        try {
          const img = state.imageData;
          const w = img.naturalWidth;
          const h = img.naturalHeight;

          const scale = Math.min(1, 800 / Math.max(w, h));
          const sw = Math.round(w * scale);
          const sh = Math.round(h * scale);

          const canvas = document.createElement('canvas');
          canvas.width = sw;
          canvas.height = sh;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, sw, sh);

          const imageData = ctx.getImageData(0, 0, sw, sh);
          const src = imageData.data;

          // 灰度化
          const gray = new Uint8Array(sw * sh);
          for (let i = 0, j = 0; i < src.length; i += 4, j++) {
            gray[j] = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
          }

          // Sobel 边缘检测
          const edges = new Uint8Array(sw * sh);
          let maxEdge = 0;
          for (let y = 1; y < sh - 1; y++) {
            for (let x = 1; x < sw - 1; x++) {
              const idx = y * sw + x;
              const gx = -1 * gray[(y-1)*sw+(x-1)] + 1 * gray[(y-1)*sw+(x+1)]
                       + -2 * gray[y*sw+(x-1)]     + 2 * gray[y*sw+(x+1)]
                       + -1 * gray[(y+1)*sw+(x-1)] + 1 * gray[(y+1)*sw+(x+1)];
              const gy = -1 * gray[(y-1)*sw+(x-1)] - 2 * gray[(y-1)*sw+x] - 1 * gray[(y-1)*sw+(x+1)]
                       +  1 * gray[(y+1)*sw+(x-1)] + 2 * gray[(y+1)*sw+x] + 1 * gray[(y+1)*sw+(x+1)];

              const mag = Math.sqrt(gx * gx + gy * gy);
              edges[idx] = mag;
              if (mag > maxEdge) maxEdge = mag;
            }
          }

          // 将边缘叠加到原图上（加深边缘）
          const dst = src;
          const edgeStrength = 0.7;
          const edgeThreshold = maxEdge * 0.15;

          for (let i = 0, j = 0; i < dst.length; i += 4, j++) {
            const e = edges[j];
            if (e > edgeThreshold) {
              const factor = 1 - (e / maxEdge) * edgeStrength;
              dst[i]     = Math.round(dst[i] * factor);
              dst[i + 1] = Math.round(dst[i + 1] * factor);
              dst[i + 2] = Math.round(dst[i + 2] * factor);
            }
          }

          ctx.putImageData(imageData, 0, 0);

          // 如果做了缩放，缩回原尺寸
          let dataUrl;
          if (scale < 1) {
            const outCanvas = document.createElement('canvas');
            outCanvas.width = w;
            outCanvas.height = h;
            const outCtx = outCanvas.getContext('2d');
            outCtx.drawImage(canvas, 0, 0, w, h);
            dataUrl = outCanvas.toDataURL('image/png');
          } else {
            dataUrl = canvas.toDataURL('image/png');
          }

          const newImg = new Image();
          newImg.onload = function() {
            finishUpload(newImg, { name: '(轮廓强化).png' }, dataUrl);
          };
          newImg.src = dataUrl;
        } catch (err) {
          hideLoader();
          console.error('轮廓强化失败：', err);
          showToast('轮廓强化失败，请重试', 'error');
        }
      }, 50);
    }

    // 返回公开 API
    return {
      removeBackground,
      rotateCW,
      rotateCCW,
      flipHorizontal,
      flipVertical,
      enhanceEdge
    };
  }

  // 导出工厂函数到全局
  global.createImageEdit = createImageEdit;

})(window);
