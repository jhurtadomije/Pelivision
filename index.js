

    /**
     *  Al cargar la ventana, se establecen los elementos y se configuran los eventos.
     */
    window.onload = function() {
        // Elementos del DOM
        const cajaBusquedaPelicula = document.getElementById('caja-busqueda-pelicula');
        const botonBuscar = document.getElementById('btn-buscar');
        const contenedorPeliculas = document.getElementById('contenedor-peliculas');
        const contenedorCarga = document.getElementById('contenedor-carga');
        const filtroTipo = document.getElementById('filtro-tipo');

        const modal = document.querySelector('.modal-detalles');
        const spanCerrar = document.querySelector('.cerrar');
        const contenidoDetalles = document.getElementById('contenido-detalles');

        const botonCrearInforme = document.getElementById('btn-crear-informe');
        const contenedorInforme = document.getElementById('contenedorInforme');
        const modalInforme = document.querySelector('.modal-informe');
        const spanCerrarInforme = document.querySelector('span.cerrar-informe');

        //configuracion de la API
        const CONFIG = {
            apiBase: 'https://www.omdbapi.com/',
            apiKey: 'bf0461d1',
        };

        let paginaActual = 1;
        let cargando = false;


        /**
         * Función que controla los errores al cargar imágenes de las películas.
         * @param {HTMLImageElement} img - La imagen que falló al cargar.
         * @param {string} titulo - El título de la película.
         */
        function controlErrorImagen(img, titulo) {
            console.error(`Error al cargar la imagen para "${titulo}". URL problemática: ${img.src}`);
            img.src = 'imagenes/noImage.png';
            img.classList.add('default');
        }

        /**
         * Función que realiza una petición a la API y devuelve la respuesta en formato JSON.
         * @param {string} url - La URL de la API.
         * @return {Promise<Object>} La respuesta de la API en formato JSON.
         */
        function fetchAPI(url) {
            return fetch(url).then(res => res.json());
        }

        /**
         * Función que realiza una búsqueda de películas según el término de búsqueda y el filtro seleccionado.
         */
        function realizarBusqueda() {
            let terminoBusqueda = cajaBusquedaPelicula.value.trim();
            let tipo = filtroTipo.value;

            if (terminoBusqueda.length >= 3) {
                paginaActual = 1;
                contenedorPeliculas.innerHTML = "";
                cargarPeliculas(terminoBusqueda, tipo, paginaActual);
            }
        }

        const debouncedBuscar = debounce(realizarBusqueda, 300);
        cajaBusquedaPelicula.addEventListener('input', function () {
            if (cargando) return;
            debouncedBuscar();
        });

        cajaBusquedaPelicula.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                realizarBusqueda();
            }
        });

        botonBuscar.addEventListener('click', realizarBusqueda);

        window.addEventListener('scroll', function () {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 80) {
                if (!cargando) {
                    cargarMasPeliculas();
                }
            }
        });

        /**
         * Función que carga más películas cuando el usuario llega al final de la página.
         */
        function cargarMasPeliculas() {
            paginaActual++;
            let terminoBusqueda = cajaBusquedaPelicula.value.trim();
            let tipo = filtroTipo.value;
            if (terminoBusqueda.length >= 3) {
                cargarPeliculas(terminoBusqueda, tipo, paginaActual);
            }
        }

        /**
         * Funcion que carga las películas desde la API según el término de búsqueda y el tipo seleccionado.
         * @param {string} terminoBusqueda - El término de búsqueda.
         * @param {string} tipo - El tipo de película (movie, series, etc.).
         * @param {number} [pagina=1] - El número de página.
         */
        async function cargarPeliculas(terminoBusqueda, tipo, pagina = 1) {
            cargando = true;
            contenedorCarga.style.display = 'block';

            try {
                let URL = `${CONFIG.apiBase}?s=${terminoBusqueda}&page=${pagina}&apikey=${CONFIG.apiKey}`;
                if (tipo) {
                    URL += `&type=${tipo}`;
                }
                const datos = await fetchAPI(URL);
                if (datos.Response === "True") {
                    mostrarPeliculas(datos.Search);
                } else {
                    if (pagina === 1) {
                        contenedorPeliculas.innerHTML = `<p class="no-resultados">No se encuentran resultados para "${terminoBusqueda}"</p>`;
                    }
                }
            } catch (error) {
                console.log('Error al cargar películas: ', error);
                if (pagina === 1) {
                    contenedorPeliculas.innerHTML = `<p class="error">Ha ocurrido un error. Por favor, inténtalo más tarde.</p>`;
                }
            } finally {

                // Agregamos un setTimeout en la carga.
                setTimeout(() => {
                    contenedorCarga.style.display = 'none';
                    cargando = false;
                }, 500);
            }
        }


        /**
         * Muestra las películas en el contenedor de películas.
         * @param {Array<Object>} peliculas - La lista de películas a mostrar.
         */
        function mostrarPeliculas(peliculas) {
            peliculas.forEach(pelicula => {
                let tarjeta = document.createElement('div');
                tarjeta.classList.add('tarjeta');

                let posterPelicula = (pelicula.Poster && pelicula.Poster !== "N/A") ? pelicula.Poster : "imagenes/noImage.jpg";
                tarjeta.innerHTML = `
                    <div class="tarjeta-contenido">
                        <div class="tarjeta-frente">
                            <img src="${posterPelicula}" alt="${pelicula.Title}">
                        </div>
                        <div class="tarjeta-dorso">
                            <h3>${pelicula.Title}</h3>
                            <p>Año: ${pelicula.Year}</p>
                            <button data-id="${pelicula.imdbID}" class="boton-detalles">Ver Detalles</button>
                        </div>
                    </div>
                `;
                contenedorPeliculas.appendChild(tarjeta);

                tarjeta.addEventListener('click', function () {
                    this.classList.toggle('voltear');
                });

                const botonDetalles = tarjeta.querySelector('.boton-detalles');
                botonDetalles.addEventListener('click', async function (e) {
                    e.stopPropagation();
                    let movieID = this.dataset.id;
                    await cargarDetallesPelicula(movieID);
                });

                const img = tarjeta.querySelector('img');
                img.addEventListener('error', function () {
                    controlErrorImagen(this, pelicula.Title);
                });
            });
        }

        /**
         * Función que carga los detalles de una película desde la API.
         * @param {string} idPelicula - El ID de la película.
         */
        async function cargarDetallesPelicula(idPelicula) {
            contenedorCarga.style.display = 'block';

            try {
                const resultado = await fetchAPI(`${CONFIG.apiBase}?i=${idPelicula}&apikey=${CONFIG.apiKey}`);
                mostrarDetallesPelicula(resultado);
            } catch (error) {
                console.error('Error al cargar los detalles:', error);
            } finally {
                contenedorCarga.style.display = 'none';
            }
        }

        /**
         * Muestra los detalles de una película en el modal de detalles.
         * @param {Object} detalles - Los detalles de la película.
         */
        function mostrarDetallesPelicula(detalles) {
            let posterPelicula = detalles.Poster !== "N/A" ? detalles.Poster : "imagenes/noImage.png";
            let ratingsHTML = detalles.Ratings && detalles.Ratings.length > 0 ? "<h3>Valoraciones: </h3>" : "";

            if (detalles.Ratings) {
                detalles.Ratings.forEach(rating => {
                    ratingsHTML += `<p><strong>${rating.Source}:</strong> ${rating.Value}</p>`;
                });
            }

            contenidoDetalles.innerHTML = `
                <h2>${detalles.Title}</h2>
                <img src="${posterPelicula}" alt="${detalles.Title}">
                <p><strong>Director: </strong> ${detalles.Director}</p>
                <p><strong>Año: </strong> ${detalles.Year}</p>
                <p><strong>Clasificación: </strong> ${detalles.Rated}</p>
                <p><strong>Estreno: </strong> ${detalles.Released}</p>
                <p><strong>Guionista: </strong> ${detalles.Writer}</p>
                <p><strong>Actores: </strong> ${detalles.Actors}</p>
                <p><strong>Sinopsis: </strong> ${detalles.Plot}</p>
                <p><strong>Idioma: </strong> ${detalles.Language}</p>
                <p><strong>Premios: </strong> ${detalles.Awards}</p>
                ${ratingsHTML}
            `;
            modal.style.display = 'block';
        }

        spanCerrar.onclick = function () {
            modal.style.display = 'none';
        };

        window.onclick = function (event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };

        /**
         * Controlamos el evento de clic para el botón "Crear Informe".
         */
        botonCrearInforme.addEventListener('click', function () {
            crearInforme();
            modalInforme.style.display = 'block';
        });

        spanCerrarInforme.onclick = function () {
            modalInforme.style.display = 'none';
        }

        window.addEventListener('click', function (event) {
            if (event.target === modalInforme) {
                modalInforme.style.display = 'none';
            }
        });

        /**
         * Función que crea un informe basado en las películas cargadas y muestra las gráficas correspondientes.
         */
        async function crearInforme() {
            contenedorCarga.style.display = 'block';

            try {
                const tarjetas = document.querySelectorAll('.tarjeta');
                const idsPeliculas = Array.from(tarjetas).map(tarjeta => {
                    const botonDetalles = tarjeta.querySelector('.boton-detalles');
                    return botonDetalles.dataset.id;
                });

                const idsLimitados = idsPeliculas.slice(0, 10);

                const detallesPeliculas = await Promise.all(idsLimitados.map(id => fetchAPI(`${CONFIG.apiBase}?i=${id}&apikey=${CONFIG.apiKey}`)));

                generarInforme(detallesPeliculas);
            } catch (error) {
                console.error('Error al generar el informe:', error);
            } finally {
                contenedorCarga.style.display = 'none';
            }
        }

        /**
         * Genera un informe de las películas y carga las gráficas.
         * @param {Array<Object>} detallesPeliculas - Los detalles de las películas.
         */
        function generarInforme(detallesPeliculas) {
            if (contenedorInforme) {
                contenedorInforme.classList.remove('oculto');
            } else {
                console.error('contenedorInforme es null');
                return;
            }

            const peliculasPorRating = detallesPeliculas.slice().sort((a, b) => parseFloat(b.imdbRating) - parseFloat(a.imdbRating));
            const peliculasPorRecaudacion = detallesPeliculas.slice().filter(p => p.BoxOffice && p.BoxOffice !== "N/A").sort((a, b) => {
                const recaudacionA = parseInt(a.BoxOffice.replace(/[\$,]/g, '')) || 0;
                const recaudacionB = parseInt(b.BoxOffice.replace(/[\$,]/g, '')) || 0;
                return recaudacionB - recaudacionA;
            });
            const peliculasPorVotos = detallesPeliculas.slice().sort((a, b) => parseInt(b.imdbVotes.replace(/,/g, '')) - parseInt(a.imdbVotes.replace(/,/g, '')));

            cargarGraficas(peliculasPorRating, peliculasPorRecaudacion, peliculasPorVotos);
        }

        google.charts.load('current', {
            packages: ['corechart', 'bar']
        });


        /**
         * Carga las gráficas con los datos proporcionados.
         * @param {Array<Object>} porRating - Películas ordenadas por rating.
         * @param {Array<Object>} porRecaudacion - Películas ordenadas por recaudación.
         * @param {Array<Object>} porVotos - Películas ordenadas por número de votos.
         */
        function cargarGraficas(porRating, porRecaudacion, porVotos) {
            google.charts.setOnLoadCallback(() => {
                dibujarGrafica(
                    'Películas más valoradas por IMDb Rating',
                    'Película',
                    'IMDb Rating',
                    porRating.map(p => [p.Title, parseFloat(p.imdbRating)]),
                    'grafico-rating'
                );

                dibujarGrafica(
                    'Películas con Mayor Recaudación en Taquilla',
                    'Película',
                    'Recaudación (USD)',
                    porRecaudacion.map(p => [p.Title, parseInt(p.BoxOffice.replace(/[\$,]/g, '')) || 0]),
                    'grafico-recaudacion'
                );

                dibujarGrafica(
                    'Películas Más Votadas en IMDb',
                    'Película',
                    'Número de Votos',
                    porVotos.map(p => [p.Title, parseInt(p.imdbVotes.replace(/,/g, '')) || 0]),
                    'grafico-votos'
                );
            });
        }

        /**
         * Dibuja una gráfica en el elemento especificado.
         * @param {string} titulo - El título de la gráfica.
         * @param {string} ejeX - El título del eje X.
         * @param {string} ejeY - El título del eje Y.
         * @param {Array<Array>} datos - Los datos a mostrar en la gráfica.
         * @param {string} elementoDestino - El ID del elemento donde se dibujará la gráfica.
         */
        function dibujarGrafica(titulo, ejeX, ejeY, datos, elementoDestino) {
            const data = new google.visualization.DataTable();
            data.addColumn('string', ejeX);
            data.addColumn('number', ejeY);

            datos.forEach(dato => data.addRow(dato));

            const options = {
                title: titulo,
                hAxis: { title: ejeX },
                vAxis: { title: ejeY, minValue: 0 },
                legend: 'none',
            };

            const chart = new google.visualization.ColumnChart(document.getElementById(elementoDestino));
            chart.draw(data, options);
        }

        // Implementamos un scroll infinito para cargar más películas
        window.addEventListener('scroll', function () {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
                if (!cargando) {
                    cargarMasPeliculas();
                }
            }
        });
    };

    /**
     * Función debounce para limitar la frecuencia con la que se puede ejecutar una función.
     * @param {Function} func - La función a ejecutar.
     * @param {number} wait - El tiempo de espera en milisegundos.
     * @return {Function} Una función que se ejecuta con un límite de frecuencia.
     */
        function debounce(func, wait) {
                    let timeout;
                    return function(...args) {
                        clearTimeout(timeout);
                        timeout = setTimeout(() => func.apply(this, args), wait);
            };
        }
