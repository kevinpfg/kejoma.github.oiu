let index = 0;
let slides = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
let categoriaActual = "zapatos";
let marcaActual = "all";

/* ================== INICIO ================== */
window.addEventListener("load", () => {
  slides = document.querySelectorAll("#slider img");
  if (slides.length > 0) showSlide(0);

  renderCarrito();

  const usuarioGuardado = localStorage.getItem("usuario");
  if (usuarioGuardado) mostrarUsuario(usuarioGuardado);

  cargarFavoritos();
  mostrarSubmenu("zapatos");
});

/* ================== BUSCADOR ================== */
function buscarProducto() {
  const texto = document.getElementById("buscador").value.toLowerCase().trim();
  const productos = document.querySelectorAll(".producto");
  const secciones = document.querySelectorAll(".marca");

  if (texto === "") {
    mostrarSubmenu(categoriaActual || "zapatos");
    return;
  }

  const submenu = document.getElementById("submenu-marcas");
  if (submenu) submenu.style.display = "none";

  secciones.forEach(sec => (sec.style.display = "block"));

  productos.forEach(p => {
    const h3 = p.querySelector("h3");
    const nombre = h3 ? h3.textContent.toLowerCase() : "";
    const marca = p.className.toLowerCase();
    p.style.display = (nombre.includes(texto) || marca.includes(texto)) ? "block" : "none";
  });

  secciones.forEach(sec => {
    const visibles = Array.from(sec.querySelectorAll(".producto"))
      .filter(p => p.style.display !== "none");
    sec.style.display = visibles.length === 0 ? "none" : "block";
  });
}

/* ================== SLIDER ================== */
function showSlide(i) {
  slides.forEach(img => (img.style.display = "none"));
  index = (i + slides.length) % slides.length;
  if (slides[index]) slides[index].style.display = "block";
}
function moveSlide(step) { showSlide(index + step); }
setInterval(() => { if (slides.length > 0) moveSlide(1); }, 4000);

/* ================== CARRITO ================== */
function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

// 🔥 ARREGLADO: usa dataset por producto, no variables globales
function agregarCarrito(nombre, precio, btn) {
  const producto = btn.closest(".producto");
  if (!producto) return;

  const talla = producto.dataset.tallaSeleccionada;
  const precioSel = parseInt(producto.dataset.precioSeleccionado || precio);

  if (!talla) {
    alert("⚠️ Selecciona una talla primero");
    return;
  }

  // Detectar categoría del producto
  let categoria = "zapatos";
  if (producto.classList.contains("balones")) categoria = "balones";
  else if (producto.classList.contains("uniformes")) categoria = "uniformes";

  // Si ya existe el mismo producto+talla, aumentar cantidad
  const existente = carrito.find(it => it.nombre === nombre && it.talla === talla);
  if (existente) {
    existente.cantidad = (existente.cantidad || 1) + 1;
  } else {
    carrito.push({ nombre, precio: precioSel, talla, categoria, cantidad: 1 });
  }
  guardarCarrito();
  renderCarrito();
  alert("Producto agregado 🛒");

  // Reset talla del producto
  delete producto.dataset.tallaSeleccionada;
  delete producto.dataset.precioSeleccionado;
  producto.querySelectorAll(".tallas span, .talla").forEach(t => t.classList.remove("active"));
}

function eliminarProducto(i) {
  carrito.splice(i, 1);
  guardarCarrito();
  renderCarrito();
  renderCarritoModal();
}

function vaciarCarrito() {
  carrito = [];
  guardarCarrito();
  renderCarrito();
  renderCarritoModal();
}

function renderCarrito() {
  // Actualizar contador del header
  const contadorEl = document.getElementById("contador");
  const cant = carrito.reduce((s, it) => s + (it.cantidad || 1), 0);
  if (contadorEl) contadorEl.textContent = cant;
  // Si el modal está abierto, refrescarlo también
  if (document.getElementById("modalCarrito").classList.contains("abierto")) {
    renderCarritoModal();
  }
}

/* ================== CARRITO MODAL AMAZON ================== */

function abrirCarritoModal() {
  const modal = document.getElementById("modalCarrito");
  modal.classList.add("abierto");
  irAPasoCarrito();
  renderCarritoModal();
  document.body.style.overflow = "hidden";
}

function cerrarCarritoModal() {
  const modal = document.getElementById("modalCarrito");
  modal.classList.remove("abierto");
  document.body.style.overflow = "";
}

function cerrarCarritoSiAfuera(e) {
  if (e.target === document.getElementById("modalCarrito")) cerrarCarritoModal();
}

function irAPasoCarrito() {
  document.querySelectorAll(".kj-step").forEach(s => s.classList.remove("active"));
  document.getElementById("paso-carrito").classList.add("active");
}

function irAPago() {
  if (carrito.length === 0) { alert("El carrito está vacío"); return; }
  document.querySelectorAll(".kj-step").forEach(s => s.classList.remove("active"));
  document.getElementById("paso-pago").classList.add("active");
  actualizarResumenPago();
}

function volverAlCarrito() {
  document.querySelectorAll(".kj-step").forEach(s => s.classList.remove("active"));
  document.getElementById("paso-carrito").classList.add("active");
}

function renderCarritoModal() {
  const lista = document.getElementById("kj-lista-items");
  const emptyMsg = document.getElementById("kj-empty-msg");
  const footer = document.getElementById("kj-cart-footer");
  const contadorEl = document.getElementById("contador");
  if (!lista) return;

  lista.innerHTML = "";
  let total = 0;

  if (carrito.length === 0) {
    emptyMsg.style.display = "block";
    lista.style.display = "none";
    if (footer) footer.style.display = "none";
  } else {
    emptyMsg.style.display = "none";
    lista.style.display = "flex";
    if (footer) footer.style.display = "flex";

    carrito.forEach((item, i) => {
      const iconos = { zapatos: "👟", uniformes: "👕", balones: "⚽" };
      const icono = iconos[item.categoria] || "🛍️";

      const div = document.createElement("div");
      div.className = "kj-item";
      div.innerHTML = `
        <div class="kj-item-icon">${icono}</div>
        <div class="kj-item-info">
          <div class="kj-item-nombre">${item.nombre}</div>
          <div class="kj-item-talla">Talla / Ref: ${item.talla}</div>
          <div class="kj-item-precio">$${item.precio.toLocaleString("es-CO")}</div>
          <div class="kj-item-qty">
            <button class="kj-qty-btn" onclick="cambiarCantidad(${i}, -1)">−</button>
            <span class="kj-qty-num">${item.cantidad || 1}</span>
            <button class="kj-qty-btn" onclick="cambiarCantidad(${i}, 1)">+</button>
          </div>
        </div>
        <button class="kj-item-del" onclick="eliminarProducto(${i})" title="Eliminar">
          <i class="fas fa-times"></i>
        </button>
      `;
      lista.appendChild(div);
      total += item.precio * (item.cantidad || 1);
    });
  }

  const cant = carrito.reduce((s, it) => s + (it.cantidad || 1), 0);
  document.getElementById("kj-cant-items").textContent = cant;
  document.getElementById("kj-subtotal").textContent = "$" + total.toLocaleString("es-CO");
  document.getElementById("kj-total-final").textContent = "$" + total.toLocaleString("es-CO");
  if (contadorEl) contadorEl.textContent = cant;
}

function cambiarCantidad(i, delta) {
  if (!carrito[i].cantidad) carrito[i].cantidad = 1;
  carrito[i].cantidad += delta;
  if (carrito[i].cantidad <= 0) carrito.splice(i, 1);
  guardarCarrito();
  renderCarritoModal();
}

function actualizarResumenPago() {
  const resumen = document.getElementById("kj-resumen-items");
  let total = 0;
  resumen.innerHTML = "";
  carrito.forEach(item => {
    const cant = item.cantidad || 1;
    const subtotal = item.precio * cant;
    total += subtotal;
    const div = document.createElement("div");
    div.className = "kj-resumen-item";
    div.innerHTML = `<span>${item.nombre} x${cant}</span><span>$${subtotal.toLocaleString("es-CO")}</span>`;
    resumen.appendChild(div);
  });
  document.getElementById("kj-res-sub").textContent = "$" + total.toLocaleString("es-CO");
  document.getElementById("kj-res-total").textContent = "$" + total.toLocaleString("es-CO");
}

/* ================== SELECCIÓN MÉTODO PAGO ================== */
let metodoActual = "tarjeta";

function seleccionarMetodo(metodo, el) {
  metodoActual = metodo;
  document.querySelectorAll(".kj-metodo").forEach(m => m.classList.remove("activo"));
  el.classList.add("activo");
  document.querySelectorAll(".kj-metodo-form").forEach(f => f.style.display = "none");
  const form = document.getElementById("form-" + metodo);
  if (form) form.style.display = metodo === "tarjeta" ? "grid" : "block";
}

/* ================== VALIDACIONES ================== */
function validarCampo(el) {
  const id = el.id;
  const val = el.value.trim();
  let error = "";

  if (id === "p-nombre" && val.length < 3) error = "Ingresa tu nombre completo";
  if (id === "p-telefono" && !/^[0-9]{7,10}$/.test(val.replace(/\s/g,""))) error = "Número no válido";
  if (id === "p-direccion" && val.length < 5) error = "Ingresa una dirección válida";
  if (id === "p-ciudad" && val.length < 2) error = "Ingresa tu ciudad";
  if (id === "p-depto" && val === "") error = "Selecciona un departamento";
  if (id === "p-tarjeta") {
    const nums = val.replace(/\s/g,"");
    if (!/^[0-9]{16}$/.test(nums)) error = "Número de tarjeta inválido";
  }
  if (id === "p-nombre-tarjeta" && val.length < 3) error = "Ingresa el nombre tal como aparece en la tarjeta";
  if (id === "p-vencimiento" && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(val)) error = "Formato MM/AA";
  if (id === "p-cvv" && !/^[0-9]{3,4}$/.test(val)) error = "CVV inválido";
  if (id === "p-banco" && val === "") error = "Selecciona tu banco";
  if (id === "p-cedula" && !/^[0-9]{6,12}$/.test(val)) error = "Documento inválido";

  const errEl = document.getElementById("err-" + id.replace("p-",""));
  if (errEl) errEl.textContent = error;
  el.classList.toggle("valido", error === "" && val !== "");
  el.classList.toggle("invalido", error !== "");
  return error === "";
}

function formatearTarjeta(el) {
  let val = el.value.replace(/\D/g,"").substring(0,16);
  el.value = val.replace(/(.{4})/g,"$1 ").trim();
}

function formatearFecha(el) {
  let val = el.value.replace(/\D/g,"");
  if (val.length >= 2) val = val.substring(0,2) + "/" + val.substring(2,4);
  el.value = val;
}

/* ================== PROCESAR PAGO ================== */
function procesarPago() {
  // Validar campos obligatorios de dirección
  const camposDir = ["p-nombre","p-telefono","p-direccion","p-ciudad","p-depto"];
  let ok = true;
  camposDir.forEach(id => {
    const el = document.getElementById(id);
    if (el && !validarCampo(el)) ok = false;
  });

  // Validar método de pago
  if (metodoActual === "tarjeta") {
    ["p-tarjeta","p-nombre-tarjeta","p-vencimiento","p-cvv"].forEach(id => {
      const el = document.getElementById(id);
      if (el && !validarCampo(el)) ok = false;
    });
  }
  if (metodoActual === "pse") {
    ["p-banco","p-cedula"].forEach(id => {
      const el = document.getElementById(id);
      if (el && !validarCampo(el)) ok = false;
    });
  }

  if (!ok) {
    alert("⚠️ Por favor corrige los campos marcados en rojo");
    return;
  }

  // Simular procesamiento
  const btn = document.querySelector(".kj-btn-pagar");
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
  btn.disabled = true;

  setTimeout(() => {
    mostrarExito();
  }, 2000);
}

function mostrarExito() {
  document.querySelectorAll(".kj-step").forEach(s => s.classList.remove("active"));
  document.getElementById("paso-exito").classList.add("active");

  const nombre   = document.getElementById("p-nombre").value;
  const ciudad   = document.getElementById("p-ciudad").value;
  const dir      = document.getElementById("p-direccion").value;
  const total    = carrito.reduce((s, it) => s + it.precio * (it.cantidad || 1), 0);
  const pedidoNum = "KEJ-" + Date.now().toString().slice(-6);
  const ahora    = new Date();
  const fechaStr = ahora.toLocaleDateString("es-CO", { day:"2-digit", month:"long", year:"numeric" });
  const horaStr  = ahora.toLocaleTimeString("es-CO", { hour:"2-digit", minute:"2-digit" });
  const metodoLabel = { tarjeta:"💳 Tarjeta", nequi:"📱 Nequi", pse:"🏦 PSE", contra:"💵 Contra entrega" };

  // Actualizar mensaje principal
  document.getElementById("kj-exito-msg").textContent =
    `Pedido ${pedidoNum} confirmado. Te enviaremos una confirmación pronto.`;

  // Llenar recibo
  document.getElementById("recibo-num-pedido").textContent = "#" + pedidoNum;
  document.getElementById("recibo-codigo-barras").textContent = pedidoNum;
  document.getElementById("recibo-fecha").textContent = fechaStr + " — " + horaStr;
  document.getElementById("recibo-nombre").textContent = nombre;
  document.getElementById("recibo-dir").textContent = dir + ", " + ciudad;
  document.getElementById("recibo-metodo").textContent = metodoLabel[metodoActual] || metodoActual;
  document.getElementById("recibo-subtotal").textContent = "$" + total.toLocaleString("es-CO");
  document.getElementById("recibo-total").textContent    = "$" + total.toLocaleString("es-CO");

  const tbody = document.getElementById("recibo-items-tbody");
  tbody.innerHTML = "";
  carrito.forEach(it => {
    const subtotal = it.precio * (it.cantidad || 1);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${it.nombre}${it.talla ? " <small>(T:"+it.talla+")</small>" : ""}</td>
      <td>${it.cantidad || 1}</td>
      <td>$${subtotal.toLocaleString("es-CO")}</td>
    `;
    tbody.appendChild(tr);
  });

  window._pedidoExito = { pedidoNum, nombre, ciudad, dir, total };
}

function imprimirRecibo() {
  window.print();
}

function confirmarWhatsApp() {
  const p = window._pedidoExito || {};
  const total = carrito.reduce ? carrito.reduce((s,it)=>s+it.precio*(it.cantidad||1),0) : 0;
  let msg = `Hola KEJOMA! Quiero confirmar mi pedido:
`;
  msg += `📦 Pedido: ${p.pedidoNum || "nuevo"}
`;
  msg += `👤 Nombre: ${p.nombre || ""}
`;
  msg += `📍 Dirección: ${p.dir || ""}, ${p.ciudad || ""}
`;
  carrito.forEach(it => msg += `• ${it.nombre} (${it.talla}) x${it.cantidad||1} = $${(it.precio*(it.cantidad||1)).toLocaleString()}
`);
  msg += `💰 TOTAL: $${total.toLocaleString()}`;
  window.open("https://wa.me/573102519142?text=" + encodeURIComponent(msg));
}

function toggleCarrito() { abrirCarritoModal(); }

/* ================== PAGOS ================== */
function comprarWhatsApp() {
  if (carrito.length === 0) { alert("El carrito está vacío"); return; }
  let mensaje = "Hola, quiero comprar:\n";
  carrito.forEach(i => mensaje += `${i.nombre} (Talla ${i.talla}) - $${i.precio}\n`);
  window.open(`https://wa.me/573102519142?text=${encodeURIComponent(mensaje)}`);
}
function pagarNequi() { alert("Pago por Nequi: envía al número 300XXXXXXX"); }
function pagarPayPal() { window.open("https://www.paypal.com"); }
function pagarWeb() {
  if (carrito.length === 0) { alert("Carrito vacío"); return; }
  alert("Pago realizado correctamente ✅");
  descargarPDF();
  vaciarCarrito();
}

/* ================== PDF ================== */
function descargarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(18); doc.text("RECIBO KEJOMA", 20, 20);
  doc.setFontSize(12);
  let y = 40, total = 0;
  carrito.forEach(it => {
    doc.text(`${it.nombre} (Talla ${it.talla}) - $${it.precio}`, 20, y);
    y += 10; total += it.precio;
  });
  doc.text("------------------------", 20, y); y += 10;
  doc.text(`TOTAL: $${total}`, 20, y);
  doc.save("recibo-kejoma.pdf");
}

/* ================== MENU / SUBMENU ================== */
function toggleMenu() {
  document.getElementById("menu").classList.toggle("show");
}

function mostrarSubmenu(tipo) {
  categoriaActual = tipo;
  marcaActual = "all";

  const submenu = document.getElementById("submenu-marcas");
  if (submenu) submenu.style.display = "flex";

  // Mostrar solo productos de la categoría seleccionada
  document.querySelectorAll(".producto").forEach(p => {
    p.style.display = p.classList.contains(tipo) ? "block" : "none";
  });

  // Mostrar solo secciones que tengan productos visibles
  document.querySelectorAll(".marca").forEach(sec => {
    const visibles = Array.from(sec.querySelectorAll(".producto"))
      .filter(p => p.style.display !== "none");
    sec.style.display = visibles.length === 0 ? "none" : "block";
  });
}

function filtrarMarca(marca) {
  marcaActual = marca;
  // Filtrar a nivel de PRODUCTO (no de sección)
  document.querySelectorAll(".producto").forEach(p => {
    const enCategoria = p.classList.contains(categoriaActual);
    const enMarca = marca === "all" || p.classList.contains(marca);
    p.style.display = (enCategoria && enMarca) ? "block" : "none";
  });

  // Mostrar/ocultar secciones según tengan productos visibles
  document.querySelectorAll(".marca").forEach(sec => {
    const visibles = Array.from(sec.querySelectorAll(".producto"))
      .filter(p => p.style.display !== "none");
    sec.style.display = visibles.length === 0 ? "none" : "block";
  });
}

function filtrar(marca) {
  document.querySelectorAll(".marca").forEach(sec => {
    sec.style.display = (marca === "all" || sec.classList.contains(marca)) ? "block" : "none";
  });
}

/* ================== LOGIN ================== */
function toggleLogin() {
  const el = document.getElementById("login-form-container");
  if (!el) return;
  const visible = el.style.display === "block";
  el.style.display = visible ? "none" : "block";
  el.style.opacity = visible ? "0" : "1";
}

function login() {
  const correo = document.getElementById("correo").value;
  const pass = document.getElementById("password").value;
  const mensaje = document.getElementById("mensaje-login");

  if (correo === "" || pass === "") {
    mensaje.className = "error";
    mensaje.textContent = "⚠️ Completa todos los campos";
    return;
  }
  localStorage.setItem("usuario", correo);
  mostrarUsuario(correo);
  mensaje.className = "ok";
  mensaje.textContent = "✅ Sesión iniciada";
  setTimeout(toggleLogin, 1000);
}

function mostrarUsuario(nombre) {
  const btn = document.querySelector(".btn-login");
  btn.innerHTML = `<i class="fas fa-user"></i> ${nombre}`;
  btn.onclick = cerrarSesion;
}

function cerrarSesion() {
  localStorage.removeItem("usuario");
  const btn = document.querySelector(".btn-login");
  btn.innerHTML = `<i class="fas fa-user"></i>`;
  btn.onclick = toggleLogin;
  alert("Sesión cerrada");
}

/* ================== FAVORITOS ================== */
function cargarFavoritos() {
  document.querySelectorAll(".btn-fav").forEach(b => {
    const m = b.getAttribute("onclick");
    if (!m) return;
    const nombre = m.split("'")[1];
    if (favoritos.includes(nombre)) {
      b.textContent = "❤️ Guardado";
      b.style.background = "red";
    }
  });
}

function agregarFavoritoBtn(boton, nombre) {
  if (favoritos.includes(nombre)) {
    favoritos = favoritos.filter(f => f !== nombre);
    boton.textContent = "❤️ Favorito";
    boton.style.background = "#ff4081";
  } else {
    favoritos.push(nombre);
    boton.textContent = "❤️ Guardado";
    boton.style.background = "red";
  }
  localStorage.setItem("favoritos", JSON.stringify(favoritos));
}

/* ================== TALLAS (🔥 ARREGLADO por producto) ================== */
function seleccionarTalla(el) {
  const producto = el.closest(".producto");
  if (!producto) return;
  producto.querySelectorAll(".tallas span, .talla, span").forEach(t => {
    if (t.parentElement === el.parentElement) t.classList.remove("active");
  });
  el.classList.add("active");
  producto.dataset.tallaSeleccionada = el.textContent.trim();
  producto.dataset.precioSeleccionado = el.dataset.precio || "0";
}

/* ================== GALERÍA DE PRODUCTOS (ZAPATOS, UNIFORMES Y BALONES) ================== */

function abrirGaleria(imagenes) {
  const modal = document.getElementById("modalGaleria");
  const imgGrande = document.getElementById("imgGrande");
  const miniaturas = document.getElementById("miniaturas");
  
  if (!modal || !imgGrande || !miniaturas) return;

  // Limpiar imagen anterior antes de cargar la nueva
  imgGrande.src = "";
  miniaturas.innerHTML = "";

  modal.style.display = "flex";
  
  imgGrande.src = imagenes[0];

  imagenes.forEach((rutaImg) => {
    const mini = document.createElement("img");
    mini.src = rutaImg;
    mini.alt = "Ángulo del producto";
    mini.onclick = () => { imgGrande.src = rutaImg; };
    miniaturas.appendChild(mini);
  });
}

function cerrarGaleria() {
  const modal = document.getElementById("modalGaleria");
  const imgGrande = document.getElementById("imgGrande");
  const miniaturas = document.getElementById("miniaturas");
  if (modal) modal.style.display = "none";
  // Limpiar al cerrar para que no quede la imagen guardada
  if (imgGrande) imgGrande.src = "";
  if (miniaturas) miniaturas.innerHTML = "";
}

// Cerrar la ventana si el cliente hace clic afuera de la foto central
window.addEventListener("click", (event) => {
  const modal = document.getElementById("modalGaleria");
  if (event.target === modal) {
    modal.style.display = "none";
    document.getElementById("imgGrande").src = "";
    document.getElementById("miniaturas").innerHTML = "";
  }
});

/* ================== ADS ROTACIÓN ================== */
const adsIzq = ["oferta1.jpg","oferta2.jpg","oferta3.jpg","oferta4.jpg"];
const adsDer = ["oferta5.jpg","oferta6.jpg","oferta7.jpg","oferta8.jpg"];
let _ai = 0;
setInterval(() => {
  const izq = document.getElementById("ad-izq");
  const der = document.getElementById("ad-der");
  if (izq) izq.src = adsIzq[_ai];
  if (der) der.src = adsDer[_ai];
  _ai = (_ai + 1) % adsIzq.length;
}, 3000);

/* ================== MODO OSCURO ================== */
function toggleModo() {
  document.body.classList.toggle("modo-oscuro");
  const btn = document.getElementById("btn-modo");
  const icono = btn.querySelector("i");
  if (document.body.classList.contains("modo-oscuro")) {
    icono.className = "fas fa-sun";
    localStorage.setItem("modo", "oscuro");
  } else {
    icono.className = "fas fa-moon";
    localStorage.setItem("modo", "claro");
  }
}
(function() {
  if (localStorage.getItem("modo") === "oscuro") {
    document.body.classList.add("modo-oscuro");
    setTimeout(() => {
      const btn = document.getElementById("btn-modo");
      if (btn) btn.querySelector("i").className = "fas fa-sun";
    }, 100);
  }
})();