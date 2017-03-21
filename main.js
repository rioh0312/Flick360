"use strict";

// イベント列挙子
var EVENT = {};
if ('ontouchstart' in window) {
    EVENT.TOUCH_START = 'touchstart';
    EVENT.TOUCH_MOVE = 'touchmove';
    EVENT.TOUCH_END = 'touchend';
} else {
    EVENT.TOUCH_START = 'mousedown';
    EVENT.TOUCH_MOVE = 'mousemove';
    EVENT.TOUCH_END = 'mouseup';
}

(function () { // 要クラス化

    var camera, scene, renderer;
    var cube, sphere, torus, material;
    var canvas;
    var count = 0;
    var fov = 60,
        isUserInteracting = false,
        onMouseDownMouseX = 0, onMouseDownMouseY = 0,
        lon = 0, onMouseDownLon = 0,
        lat = 0, onMouseDownLat = 0,
        phi = 0, theta = 0;
    var textureLoader = new THREE.TextureLoader();
    var canvasFrame = document.getElementById('canvas-frame'); // 任意のDIV-IDを指定出来るようにすること

    // テクスチャのロード
    textureLoader.load('Panorama.jpg', function (texture) {
        texture.mapping = THREE.UVMapping;
        init(texture);
        animate();
    });

    /**
     * 初期化処理。背景テクスチャのロードに呼び出し。
     * @param {*} texture 背景テクスチャ 
     */
    function init(texture) {
        // カメラ作成
        camera = new THREE.PerspectiveCamera(fov, canvasFrame.clientWidth / canvasFrame.clientHeight, 1, 1000);

        // 背景メッシュ
        var mesh = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), new THREE.MeshBasicMaterial({ map: texture }));
        mesh.scale.x = -1;

        // シーン作成
        scene = new THREE.Scene();
        scene.add(mesh);

        // レンダラ作成
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(canvasFrame.clientWidth, canvasFrame.clientHeight);

        // canvasをフレームに追加
        canvas = renderer.domElement;
        canvasFrame.appendChild(canvas);

        // イベント定義
        canvas.addEventListener(EVENT.TOUCH_START, onCanvasMouseDown, false);
        canvas.addEventListener('mousewheel', onCanvasMouseWheel, false);
        canvas.addEventListener('MozMousePixelScroll', onCanvasMouseWheel, false);
        window.addEventListener('resize', onWindowResized, false);
        onWindowResized(null);
    }

    /**
     * ウィンドウリサイズイベント
     * @param {*} event 
     */
    function onWindowResized(event) {
        renderer.setSize(canvasFrame.clientWidth, canvasFrame.clientHeight);
        camera.projectionMatrix.makePerspective(fov, canvasFrame.clientWidth / canvasFrame.clientHeight, 1, 1100);
    }

    /**
     * マウスダウン(タッチスタート)イベント
     * @param {*} event 
     */
    function onCanvasMouseDown(event) {
        //event.preventDefault();

        // マウスダウン(タッチスタート)位置取得
        if (event.clientX) {
            onMouseDownMouseX = event.clientX;
            onMouseDownMouseY = event.clientY;
        } else if (event.touches) {
            onMouseDownMouseX = event.touches[0].clientX
            onMouseDownMouseY = event.touches[0].clientY;
        } else {
            onMouseDownMouseX = event.changedTouches[0].clientX
            onMouseDownMouseY = event.changedTouches[0].clientY
        }
        onMouseDownLon = lon;
        onMouseDownLat = lat;

        // マウスムーブ(タッチムーブ)、マウスアップ(タッチエンド)の検知を開始
        canvas.addEventListener(EVENT.TOUCH_MOVE, onCanvasMouseMove, false);
        canvas.addEventListener(EVENT.TOUCH_END, onCanvasMouseUp, false);
        canvasFrame.addEventListener(EVENT.TOUCH_MOVE, onCanvasFrameMouseMove, false);
    }

    /**
     * キャンバス枠のマウスムーブイベント
     * @param {*} event 
     */
    function onCanvasFrameMouseMove(event) {
        // キャンバスから外れたら各種イベントを終了させる
        if (event.toElement.tagName !== 'CANVAS') {
            canvas.removeEventListener(EVENT.TOUCH_MOVE, onCanvasMouseMove, false);
            canvas.removeEventListener(EVENT.TOUCH_END, onCanvasMouseUp, false);
            canvasFrame.removeEventListener(EVENT.TOUCH_MOVE, onCanvasFrameMouseMove, false);
            console.log('[Event]CanvasFrameMouseMove');
        }
    }

    /**
     * マウスムーブ(タッチムーブ)イベント
     * @param {*} event 
     */
    function onCanvasMouseMove(event) {
        //event.preventDefault();

        // マウスムーブ位置(タッチムーブ位置)取得
        if (event.clientX) {
            var touchClientX = event.clientX;
            var touchClientY = event.clientY;
        } else if (event.touches) {
            var touchClientX = event.touches[0].clientX
            var touchClientY = event.touches[0].clientY;
        } else {
            var touchClientX = event.changedTouches[0].clientX
            var touchClientY = event.changedTouches[0].clientY
        }
        lon = (touchClientX - onMouseDownMouseX) * -0.1 + onMouseDownLon;
        lat = (touchClientY - onMouseDownMouseY) * -0.1 + onMouseDownLat;
    }


    /**
     * マウスアップ(タッチエンド)イベント
     * @param {*} event 
     */
    function onCanvasMouseUp(event) {
        // マウスムーブ(タッチムーブ)、マウスアップ(タッチエンド)の検知を終了
        canvas.removeEventListener(EVENT.TOUCH_MOVE, onCanvasMouseMove, false);
        canvas.removeEventListener(EVENT.TOUCH_END, onCanvasMouseUp, false);
    }

    /**
     * マウスホイールイベント
     * @param {*} event 
     */
    function onCanvasMouseWheel(event) {
        // WebKit
        if (event.wheelDeltaY) {
            fov -= event.wheelDeltaY * 0.05;
            // Opera / Explorer 9
        } else if (event.wheelDelta) {
            fov -= event.wheelDelta * 0.05;
            // Firefox
        } else if (event.detail) {
            fov += event.detail * 1.0;
        }
        camera.projectionMatrix.makePerspective(fov, canvasFrame.clientWidth / canvasFrame.clientHeight, 1, 1100);
    }

    /**
     * フレーム更新＆レンダリング
     */
    function animate() {
        requestAnimationFrame(animate);
        render();
    }

    /**
     * レンダリング
     */
    function render() {
        // 注視点位置の更新
        phi = THREE.Math.degToRad(90 - lat);
        theta = THREE.Math.degToRad(lon);
        camera.position.x = 100 * Math.sin(phi) * Math.cos(theta);
        camera.position.y = 100 * Math.cos(phi);
        camera.position.z = 100 * Math.sin(phi) * Math.sin(theta);
        camera.lookAt(scene.position);

        // レンダリング
        renderer.render(scene, camera);
    }

})();