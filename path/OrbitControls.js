/* Classic (non-module) OrbitControls for the AURA bottle.
   Works on file:// (direct browser/Firefox open) and any server.
   Attaches to window.THREE.OrbitControls. */
(function (THREE) {
  if (!THREE) return;
  var _twoPI = 2 * Math.PI;

  function OrbitControls(object, domElement) {
    this.object = object;
    this.domElement = domElement;

    this.target = new THREE.Vector3();
    this.enableDamping = false;
    this.dampingFactor = 0.05;
    this.enableZoom = true;
    this.enablePan = false;
    this.enableRotate = true;
    this.rotateSpeed = 1.0;
    this.zoomSpeed = 1.0;
    this.minDistance = 0;
    this.maxDistance = Infinity;
    this.minPolarAngle = 0;
    this.maxPolarAngle = Math.PI;
    this.enabled = true;

    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    this.zoom0 = this.object.zoom;

    this._spherical = new THREE.Spherical();
    this._sphericalDelta = new THREE.Spherical();
    this._scale = 1;
    this._rotateStart = new THREE.Vector2();
    this._rotateEnd = new THREE.Vector2();
    this._rotateDelta = new THREE.Vector2();
    this._dollyStart = new THREE.Vector2();
    this._dollyEnd = new THREE.Vector2();
    this._dollyDelta = new THREE.Vector2();

    this.STATE = { NONE: -1, ROTATE: 0, DOLLY: 1, PAN: 2 };
    this._state = this.STATE.NONE;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onMouseWheel = this._onMouseWheel.bind(this);

    if (this.domElement) this.connect();
    this.update();
  }

  OrbitControls.prototype.connect = function () {
    this.domElement.style.touchAction = 'none';
    this.domElement.addEventListener('pointerdown', this._onPointerDown);
    this.domElement.addEventListener('pointermove', this._onPointerMove);
    this.domElement.addEventListener('pointerup', this._onPointerUp);
    this.domElement.addEventListener('wheel', this._onMouseWheel, { passive: false });
  };

  OrbitControls.prototype.dispose = function () {
    this.domElement.style.touchAction = 'auto';
    this.domElement.removeEventListener('pointerdown', this._onPointerDown);
    this.domElement.removeEventListener('pointermove', this._onPointerMove);
    this.domElement.removeEventListener('pointerup', this._onPointerUp);
    this.domElement.removeEventListener('wheel', this._onMouseWheel);
  };

  OrbitControls.prototype.saveState = function () {
    this.target0.copy(this.target);
    this.position0.copy(this.object.position);
    this.zoom0 = this.object.zoom;
  };

  OrbitControls.prototype.reset = function () {
    this.target.copy(this.target0);
    this.object.position.copy(this.position0);
    this.object.zoom = this.zoom0;
    this.object.updateProjectionMatrix();
    this.update();
    this._state = this.STATE.NONE;
  };

  OrbitControls.prototype.update = function () {
    var position = this.object.position;
    var offset = position.clone().sub(this.target);
    this._spherical.setFromVector3(offset);

    if (this.enableDamping) {
      this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor;
      this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor;
    } else {
      this._spherical.theta += this._sphericalDelta.theta;
      this._spherical.phi += this._sphericalDelta.phi;
    }

    this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi));
    this._spherical.makeSafe();
    this._spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this._spherical.radius * this._scale));

    offset.setFromSpherical(this._spherical);
    position.copy(this.target).add(offset);
    this.object.lookAt(this.target);

    if (this.enableDamping) {
      this._sphericalDelta.theta *= (1 - this.dampingFactor);
      this._sphericalDelta.phi *= (1 - this.dampingFactor);
    } else {
      this._sphericalDelta.set(0, 0, 0);
    }
    this._scale = 1;
  };

  OrbitControls.prototype._getZoomScale = function (delta) {
    var normalized = Math.abs(delta * 0.01);
    return Math.pow(0.95, this.zoomSpeed * normalized);
  };

  OrbitControls.prototype._onPointerDown = function (event) {
    if (this.enabled === false) return;
    this.domElement.setPointerCapture(event.pointerId);
    if (event.pointerType === 'mouse') {
      if (event.button === 2 || (event.ctrlKey === true && this.enablePan)) {
        this._state = this.STATE.PAN;
      } else {
        this._state = this.STATE.ROTATE;
      }
    } else {
      this._state = this.STATE.ROTATE;
    }
    this._rotateStart.set(event.clientX, event.clientY);
    this._dollyStart.set(event.clientX, event.clientY);
    event.preventDefault();
  };

  OrbitControls.prototype._onPointerMove = function (event) {
    if (this.enabled === false) return;
    if (this._state === this.STATE.ROTATE && this.enableRotate) {
      this._rotateEnd.set(event.clientX, event.clientY);
      this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart);
      var el = this.domElement;
      this._sphericalDelta.theta -= _twoPI * this._rotateDelta.x / el.clientHeight * this.rotateSpeed;
      this._sphericalDelta.phi -= _twoPI * this._rotateDelta.y / el.clientHeight * this.rotateSpeed;
      this._rotateStart.copy(this._rotateEnd);
      this.update();
    } else if (this._state === this.STATE.DOLLY && this.enableZoom) {
      this._dollyEnd.set(event.clientX, event.clientY);
      this._dollyDelta.subVectors(this._dollyEnd, this._dollyStart);
      if (this._dollyDelta.y > 0) this._scale /= this._getZoomScale(this._dollyDelta.y);
      else if (this._dollyDelta.y < 0) this._scale *= this._getZoomScale(this._dollyDelta.y);
      this._dollyStart.copy(this._dollyEnd);
      this.update();
    }
  };

  OrbitControls.prototype._onPointerUp = function () {
    this._state = this.STATE.NONE;
  };

  OrbitControls.prototype._onMouseWheel = function (event) {
    if (this.enabled === false || this.enableZoom === false) return;
    event.preventDefault();
    if (event.deltaY < 0) this._scale *= this._getZoomScale(event.deltaY);
    else this._scale /= this._getZoomScale(event.deltaY);
    this.update();
  };

  THREE.OrbitControls = OrbitControls;
})(window.THREE);
