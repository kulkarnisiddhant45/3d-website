(function () {
  var canvas = document.getElementById('gl');
  if (!window.THREE) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Renderer, scene, camera
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  var l1 = new THREE.PointLight(0x6f8bff, 2, 50); l1.position.set(6, 5, 6); scene.add(l1);
  var l2 = new THREE.PointLight(0xff7ab8, 1.8, 50); l2.position.set(-6, -4, 5); scene.add(l2);

  // Main shape (torus knot)
  var knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.7, 0.52, 220, 32, 2, 3),
    new THREE.MeshPhysicalMaterial({
      color: 0x5b6dff, metalness: 0.55, roughness: 0.18,
      clearcoat: 1, clearcoatRoughness: 0.1
    })
  );
  scene.add(knot);

  // Wireframe shape around it
  var wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(3.4, 1),
    new THREE.MeshBasicMaterial({ color: 0x8fa2ff, wireframe: true, transparent: true, opacity: 0.25 })
  );
  scene.add(wire);

  // Particles
  var N = 700, pos = new Float32Array(N * 3);
  for (var i = 0; i < N; i++) {
    var r = 6 + Math.random() * 10,
        a = Math.random() * 6.283,
        b = Math.acos(2 * Math.random() - 1);
    pos[i * 3]     = r * Math.sin(b) * Math.cos(a);
    pos[i * 3 + 1] = r * Math.sin(b) * Math.sin(a);
    pos[i * 3 + 2] = r * Math.cos(b) - 4;
  }
  var pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var pts = new THREE.Points(
    pg,
    new THREE.PointsMaterial({ color: 0x8fa2ff, size: 0.06, transparent: true, opacity: 0.8 })
  );
  scene.add(pts);

  // Mouse and scroll
  var mx = 0, my = 0, scroll = 0, target = 0;
  addEventListener('pointermove', function (e) {
    mx = (e.clientX / innerWidth - 0.5) * 2;
    my = (e.clientY / innerHeight - 0.5) * 2;
  });

  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    target = h > 0 ? scrollY / h : 0;
    document.getElementById('bar').style.width = (target * 100) + '%';
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Resize
  function resize() {
    var w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  // Colors that change while scrolling
  var c1 = new THREE.Color(0x5b6dff),
      c2 = new THREE.Color(0xff5fa2),
      c3 = new THREE.Color(0x19d3b0),
      tmp = new THREE.Color();
  var clock = new THREE.Clock();

  // Animation loop
  function frame() {
    var t = reduce ? 0 : clock.getElapsedTime();
    scroll += (target - scroll) * 0.06;

    knot.rotation.x = t * 0.25 + scroll * 6;
    knot.rotation.y = t * 0.35 + scroll * 9 + mx * 0.4;
    knot.rotation.z = my * 0.2;

    wire.rotation.y = -t * 0.1 - scroll * 3;
    wire.rotation.x = t * 0.07;
    pts.rotation.y = t * 0.02 + scroll * 1.5;

    knot.position.x = Math.sin(scroll * Math.PI * 3) * (innerWidth > 700 ? 2.6 : 0);
    knot.position.y = -scroll * 0.5 + my * -0.2;

    var s = 1 + Math.sin(scroll * Math.PI) * 0.45;
    knot.scale.setScalar(innerWidth > 700 ? s : s * 0.7);
    wire.scale.setScalar(innerWidth > 700 ? 1 : 0.7);

    camera.position.x += (mx * 0.6 - camera.position.x) * 0.05;
    camera.position.y += (-my * 0.4 - camera.position.y) * 0.05;
    camera.position.z = 9 - scroll * 2;
    camera.lookAt(0, 0, 0);

    if (scroll < 0.5) tmp.copy(c1).lerp(c2, scroll * 2);
    else tmp.copy(c2).lerp(c3, (scroll - 0.5) * 2);
    knot.material.color.copy(tmp);

    renderer.render(scene, camera);
    if (!reduce) requestAnimationFrame(frame);
  }

  if (reduce) {
    addEventListener('scroll', function () { requestAnimationFrame(frame); }, { passive: true });
  }
  frame();
})();