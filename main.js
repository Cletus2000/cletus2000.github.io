// Constants and Configuration
const CONFIG = {
    DEFAULT_SORT: 'date-desc',
    URLS: {
        PROJECTS_DATA: './bd.json'
    }
};



// Change between dark and light theme
document.addEventListener("DOMContentLoaded", () => {
    const toggleButton = document.getElementById("theme-toggle");
    const currentTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", currentTheme);
    toggleButton.innerHTML = currentTheme === "dark" ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

    toggleButton.addEventListener("click", () => {
        const newTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        toggleButton.innerHTML = newTheme === "dark" ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
});



// Change language
document.addEventListener("DOMContentLoaded", () => {
    const languageButton = document.getElementById("language-toggle");
    const elementsWithTranslation = document.querySelectorAll("[data-en], [data-es]");
    
    // Get saved language from local storage or set default to English
    const currentLanguage = localStorage.getItem("language") || "en";
    document.documentElement.lang = currentLanguage;
    setLanguage(currentLanguage);
    languageButton.innerHTML = currentLanguage === "en" 
        ? '<img src="https://flagicons.lipis.dev/flags/4x3/es.svg" alt="ES" class="flag-icon">' 
        : '<img src="https://flagicons.lipis.dev/flags/4x3/us.svg" alt="US" class="flag-icon">';
    
    languageButton.addEventListener("click", () => {
        const newLanguage = document.documentElement.lang === "en" ? "es" : "en";
        
        // Buscar la instancia de ProjectsApp en el ámbito global
        if (window.projectsAppInstance) {
            window.projectsAppInstance.ui.setLanguage(newLanguage);
        }
        
        setLanguage(newLanguage);
        localStorage.setItem("language", newLanguage);
        languageButton.innerHTML = newLanguage === "en" 
            ? '<img src="https://flagicons.lipis.dev/flags/4x3/es.svg" alt="ES" class="flag-icon">' 
            : '<img src="https://flagicons.lipis.dev/flags/4x3/us.svg" alt="US" class="flag-icon">';
    });

    function setLanguage(language) {
        elementsWithTranslation.forEach(element => {
            if (element.getAttribute(`data-${language}`)) {
                if (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA') {
                    element.innerHTML = element.getAttribute(`data-${language}`);
                } else {
                    element.placeholder = element.getAttribute(`data-${language}`);
                }
            }
        });
        document.documentElement.lang = language;
    }
});



// Hamburger menu
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const navLinksItems = document.querySelectorAll('.nav-links li a');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });
}

// Close menu when a link is clicked
navLinksItems.forEach(item => {
    item.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
    });
});

// Bigger header on scroll
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});





// State Management
class ProjectsState {
    constructor() {
        this.originalProjectsData = []; // Guardar los datos originales
        this.projectsData = [];
        this.filteredProjects = [];
        this.activeTags = [];
        this.currentProjectIndex = 0;
        this.urlParams = new URLSearchParams(window.location.search);
        this.currentLanguage = localStorage.getItem("language") || "en";
    }

    initializeProjects(projects) {
        // Guardar los datos originales
        this.originalProjectsData = projects;
        
        // Transformar los proyectos para tener campos planos basados en el idioma actual
        this.projectsData = this.originalProjectsData.map(project => this.flattenProjectForLanguage(project));
        this.filteredProjects = [...this.projectsData];
    }

    flattenProjectForLanguage(project) {
        // Manejar casos donde los campos multilenguaje podrían no existir
        return {
            ...project,
            title: this.getLocalizedValue(project.title),
            description: this.getLocalizedValue(project.description),
            shortDescription: this.getLocalizedValue(project.shortDescription),
            tags: this.getLocalizedValue(project.tags) || [], // Asegurar que siempre sea un array
            images: project.images || [],
            date: project.date,
            github: project.github,
            demo: project.demo,
            id: project.id,
            thumbnail: project.thumbnail
        };
    }
    getLocalizedValue(value) {
        // Manejar diferentes estructuras de datos
        if (typeof value === 'string') {
            return value; // Si ya es un string, devolverlo directamente
        }
        
        if (typeof value === 'object' && value !== null) {
            return value[this.currentLanguage] || value['en'] || ''; // Fallback a inglés si no existe
        }
        
        return ''; // Valor por defecto si no se puede localizar
    }

    updateLanguage(language) {
        this.currentLanguage = language;
        
        // Recargar los proyectos para el nuevo idioma
        this.projectsData = this.originalProjectsData.map(project => 
            this.flattenProjectForLanguage(project)
        );
        this.filteredProjects = [...this.projectsData];
    }

    filterProjects(searchTerm, sortOption) {
        this.filteredProjects = this.projectsData.filter(project => {
            const matchesSearch = this.doesProjectMatchSearch(project, searchTerm);
            const matchesTags = this.doesProjectMatchTags(project);
            return matchesSearch && matchesTags;
        });

        this.sortProjects(sortOption);
        return this.filteredProjects;
    }

    doesProjectMatchSearch(project, searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return lowerSearchTerm === '' || 
            project.title.toLowerCase().includes(lowerSearchTerm) || 
            project.description.toLowerCase().includes(lowerSearchTerm) ||
            project.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm));
    }

    doesProjectMatchTags(project) {
        return this.activeTags.length === 0 || 
            this.activeTags.every(tag => project.tags.includes(tag));
    }

    sortProjects(sortOption) {
        const sortStrategies = {
            'date-desc': (a, b) => new Date(b.date) - new Date(a.date),
            'date-asc': (a, b) => new Date(a.date) - new Date(b.date),
            'name-asc': (a, b) => a.title.localeCompare(b.title),
            'name-desc': (a, b) => b.title.localeCompare(a.title)
        };

        this.filteredProjects.sort(sortStrategies[sortOption]);
    }
}

// UI Management
class ProjectsUI {
    constructor(state) {
        this.state = state;
        this.initializeElements();
        this.setupEventListeners();
        this.setupImageGallery();
    }
    setLanguage(language) {
        // Actualizar estado de idioma en state
        this.state.updateLanguage(language);
        
        // Regenerar la lista de proyectos
        this.updateProjects();
        
        // Regenerar filtros de tags
        this.generateTagFilters();
    }

    initializeElements() {
        this.elements = {
            projectsGrid: document.getElementById('projects-grid'),
            searchInput: document.getElementById('search-input'),
            sortSelect: document.getElementById('sort-select'),
            tagFilters: document.getElementById('tag-filters'),
            overlay: document.getElementById('overlay'),
            popupContent: document.getElementById('popup-content'),
            closePopupBtn: document.getElementById('close-popup'),
            prevProjectBtn: document.getElementById('prev-project'),
            nextProjectBtn: document.getElementById('next-project'),
            navInfo: document.getElementById('nav-info')
        };
    }

    setupEventListeners() {
        const { searchInput, sortSelect, tagFilters, projectsGrid, overlay, 
                closePopupBtn, prevProjectBtn, nextProjectBtn } = this.elements;

        searchInput.addEventListener('input', () => this.handleSearch());
        sortSelect.addEventListener('change', () => this.handleSort());
        tagFilters.addEventListener('click', (e) => this.handleTagFilter(e));
        projectsGrid.addEventListener('click', (e) => this.handleProjectClick(e));
        closePopupBtn.addEventListener('click', () => this.closeProject());
        overlay.addEventListener('click', (e) => this.handleOverlayClick(e));
        prevProjectBtn.addEventListener('click', () => this.showPreviousProject());
        nextProjectBtn.addEventListener('click', () => this.showNextProject());
        
        window.addEventListener('popstate', () => this.handleBrowserNavigation());
        window.addEventListener('wheel', this.handlePopupScroll, { passive: false });
    }

    processUrlParams() {
        const queryString = window.location.search.substring(1);
        const paramParts = queryString.split('&');
        
        if (paramParts.length > 0 && paramParts[0] && !paramParts[0].includes('=')) {
            const projectId = parseInt(paramParts[0]);
            if (!isNaN(projectId)) {
                this.state.urlParams.set('project', projectId.toString());
            }
        }
        
        // Process sort parameter
        if (this.state.urlParams.has('s')) {
            this.elements.sortSelect.value = this.state.urlParams.get('s');
        }
        
        // Process tags
        if (this.state.urlParams.has('t')) {
            this.state.activeTags = this.state.urlParams.get('t').split(',');
        }
        
        // Process search
        if (this.state.urlParams.has('q')) {
            this.elements.searchInput.value = this.state.urlParams.get('q');
        }
        
        // Apply initial sorting
        const sortOption = this.elements.sortSelect.value;
        this.state.sortProjects(sortOption);
    }

    generateTagFilters() {
        // Collect unique tags
        // Recolectar tags únicos para el idioma actual
        const allTags = new Set();
        this.state.projectsData.forEach(project => {
            project.tags.forEach(tag => allTags.add(tag));
        });
        
        // Sort alphabetically
        const sortedTags = Array.from(allTags).sort();
        
        // Create tag elements
        this.elements.tagFilters.innerHTML = '';
        sortedTags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag';
            tagElement.textContent = tag;
            tagElement.dataset.tag = tag;
            
            // Check if tag is active
            if (this.state.activeTags.includes(tag)) {
                tagElement.classList.add('active');
            }
            
            this.elements.tagFilters.appendChild(tagElement);
        });
        
        // If tags were in URL, apply filter
        if (this.state.activeTags.length > 0) {
            this.updateProjects();
        }
    }

    checkUrlForProject() {
        // Check if there's a project ID in the URL
        if (this.state.urlParams.has('project')) {
            const projectId = parseInt(this.state.urlParams.get('project'));
            this.openProjectPopup(projectId);
        }
        
        // Apply filters if necessary
        if (this.elements.searchInput.value || this.state.activeTags.length > 0) {
            this.updateProjects();
        } else {
            // If no filters, ensure sorting is applied
            const sortOption = this.elements.sortSelect.value;
            this.state.sortProjects(sortOption);
            this.loadProjects(this.state.filteredProjects);
        }
    }

    updateProjects() {
        const searchTerm = this.elements.searchInput.value;
        const sortOption = this.elements.sortSelect.value;
        
        this.state.filterProjects(searchTerm, sortOption);
        this.loadProjects(this.state.filteredProjects);
    }

    loadProjects(projects) {
        const { projectsGrid } = this.elements;
        projectsGrid.innerHTML = '';
        
        if (projects.length === 0) {
            projectsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">No se encontraron proyectos que coincidan con los filtros.</p>';
            return;
        }
        
        projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            projectCard.dataset.id = project.id;
            
            projectCard.innerHTML = `
                <img src="${project.thumbnail || ''}" alt="${project.title || ''}" class="project-image">
                <div class="project-info">
                    <h3 class="project-title">${project.title || ''}</h3>
                    <p class="project-description">${project.shortDescription || ''}</p>
                    <div class="project-tags">
                        ${(project.tags || []).slice(0, 3).map(tag => `<span class="project-tag">${tag}</span>`).join('')}
                        ${(project.tags || []).length > 3 ? `<span class="project-tag">+${(project.tags || []).length - 3}</span>` : ''}
                    </div>
                </div>
            `;
            
            projectsGrid.appendChild(projectCard);
        });
    }

    handleSearch() {
        this.updateProjects();
        this.updateURL();
    }

    handleSort() {
        this.updateProjects();
        this.updateURL();
    }

    handleTagFilter(e) {
        if (e.target.classList.contains('tag')) {
            const tag = e.target.dataset.tag;
            e.target.classList.toggle('active');
            
            if (e.target.classList.contains('active')) {
                this.state.activeTags.push(tag);
            } else {
                this.state.activeTags = this.state.activeTags.filter(t => t !== tag);
            }
            
            this.updateProjects();
            this.updateURL();
        }
    }

    handleProjectClick(e) {
        const card = e.target.closest('.project-card');
        if (card) {
            const projectId = parseInt(card.dataset.id);
            this.openProjectPopup(projectId);
        }
    }

    handleOverlayClick(e) {
        if (e.target === this.elements.overlay) {
            this.elements.overlay.classList.remove('active');
            this.closeProject();
        }
    }

    handleBrowserNavigation() {
        this.state.urlParams = new URLSearchParams(window.location.search);
        this.processUrlParams();
        this.checkUrlForProject();
    }

    static handlePopupScroll(e) {
        const overlay = document.getElementById('overlay');
        const popupContent = document.getElementById('popup-content');
        
        if (overlay.classList.contains('active')) {
            e.preventDefault();
            popupContent.scrollBy({
                top: e.deltaY,
                behavior: 'auto'
            });
        }
    }

    
    openProjectPopup(projectId) {
        // Intentar encontrar el proyecto primero en los proyectos filtrados
        this.state.currentProjectIndex = this.state.filteredProjects.findIndex(p => p.id === projectId);
        
        // Si no se encuentra en los filtrados, podría ser porque se accedió directamente por URL
        if (this.state.currentProjectIndex === -1) {
            const project = this.state.projectsData.find(p => p.id === projectId);
            if (project) {
                // Resetear filtros para mostrar este proyecto
                this.elements.searchInput.value = '';
                this.state.activeTags = [];
                
                // Actualizar los tags visuales
                document.querySelectorAll('.tag.active').forEach(tag => {
                    tag.classList.remove('active');
                });
                
                this.updateProjects();
                
                // Buscar de nuevo el índice
                this.state.currentProjectIndex = this.state.filteredProjects.findIndex(p => p.id === projectId);
            } else {
                // El proyecto no existe
                return;
            }
        }
        
        // Mostrar el proyecto
        this.displayProjectInPopup(this.state.filteredProjects[this.state.currentProjectIndex]);
        
        // Actualizar navegación
        this.updateNavigation();
        
        // Mostrar overlay
        this.elements.overlay.classList.add('active');
        
        // Actualizar URL
        this.state.urlParams.set('project', projectId);
        this.updateURL(true);
    }

    displayProjectInPopup(project) {
        // Custom date parsing for DD-MM-YYYY format
        const [day, month, year] = project.date.split('-').map(Number);
        const projectDate = new Date(year, month - 1, day); // month is 0-indexed
    
        // Localized date formatting
        const dateFormats = {
            'en': {
                month: 'long',
                format: (date) => date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })
            },
            'es': {
                month: 'long',
                format: (date) => {
                    const monthNames = [
                        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
                    ];
                    return `${date.getDate()} de ${monthNames[date.getMonth()]} de ${date.getFullYear()}`;
                }
            }
        };
    
        // Get current language or default to English
        const currentLanguage = this.state.currentLanguage || 'en';
        const formattedDate = dateFormats[currentLanguage].format(projectDate);
        
        this.elements.popupContent.innerHTML = `
            <div class="popup-header">
                <h2 class="popup-title">${project.title}</h2>
            </div>
            
            <p class="popup-date" style="color: var(--color-text-secondary);" data-en="Date: ${formattedDate}" data-es="Fecha: ${formattedDate}">${formattedDate}</p>
            
            <div class="popup-tags">
            ${project.tags.map(tag => `<span class="popup-tag">${tag}</span>`).join('')}
            </div>
            
            <div class="popup-gallery" style="margin-bottom: 40px;">
                ${project.images.map(img => `<img src="${img}" alt="${project.title}" loading="lazy">`).join('')}
            </div>
            
            <p></p>
            <div class="popup-description">
                ${project.description}
            </div>
        `;
    }

    updateNavigation() {
        const translations = {
            'en': `Project ${this.state.currentProjectIndex + 1} of ${this.state.filteredProjects.length}`,
            'es': `Proyecto ${this.state.currentProjectIndex + 1} de ${this.state.filteredProjects.length}`
        };
    
        // Use the current language from the state, defaulting to English
        const currentLanguage = this.state.currentLanguage || 'en';
        
        this.elements.navInfo.textContent = translations[currentLanguage];
        this.elements.navInfo.setAttribute('data-en', translations['en']);
        this.elements.navInfo.setAttribute('data-es', translations['es']);
        
        // Habilitar/deshabilitar botones según corresponda
        this.elements.prevProjectBtn.disabled = this.state.currentProjectIndex === 0;
        this.elements.nextProjectBtn.disabled = this.state.currentProjectIndex === this.state.filteredProjects.length - 1;
    }

    showPreviousProject() {
        if (this.state.currentProjectIndex > 0) {
            this.state.currentProjectIndex--;
            this.displayProjectInPopup(this.state.filteredProjects[this.state.currentProjectIndex]);
            this.updateNavigation();
            
            // Actualizar URL
            this.state.urlParams.set('project', this.state.filteredProjects[this.state.currentProjectIndex].id);
            this.updateURL(false);
        }
    }

    showNextProject() {
        if (this.state.currentProjectIndex < this.state.filteredProjects.length - 1) {
            this.state.currentProjectIndex++;
            this.displayProjectInPopup(this.state.filteredProjects[this.state.currentProjectIndex]);
            this.updateNavigation();
            
            // Actualizar URL
            this.state.urlParams.set('project', this.state.filteredProjects[this.state.currentProjectIndex].id);
            this.updateURL(false);
        }
    }

    closeProject() {
        // Recordar los tags activos y otros parámetros importantes antes de modificar la URL
        const currentTags = this.state.urlParams.has('t') 
            ? this.state.urlParams.get('t') 
            : (this.state.activeTags.length > 0 ? this.state.activeTags.join(',') : '');
        
        const currentSearch = this.state.urlParams.has('q') 
            ? this.state.urlParams.get('q') 
            : this.elements.searchInput.value;
        
        const currentSort = this.state.urlParams.has('s') 
            ? this.state.urlParams.get('s') 
            : this.elements.sortSelect.value;
        
        // Construir nuevos parámetros sin el ID del proyecto
        const newParams = new URLSearchParams();
        
        // Restaurar parámetros importantes
        if (currentSearch) newParams.set('q', currentSearch);
        if (currentSort && currentSort !== CONFIG.DEFAULT_SORT) newParams.set('s', currentSort);
        if (currentTags) newParams.set('t', currentTags);
        
        // Reemplazar URL
        const baseUrl = window.location.pathname;
        const queryString = this.buildOptimizedQueryString(newParams);
        history.pushState({ path: baseUrl + queryString }, '', baseUrl + queryString);
        
        // Actualizar también urlParams
        this.state.urlParams = newParams;
        
        // Ocultar el overlay
        this.elements.overlay.classList.remove('active');
    }

    updateURL(pushState = true) {
        // Crear nuevo objeto URLSearchParams para la construcción optimizada
        const newParams = new URLSearchParams();
        
        // Término de búsqueda
        if (this.elements.searchInput.value) {
            newParams.set('q', this.elements.searchInput.value);
        }
        
        // Ordenación (solo si no es la predeterminada)
        if (this.elements.sortSelect.value !== CONFIG.DEFAULT_SORT) {
            newParams.set('s', this.elements.sortSelect.value);
        }
        
        // Etiquetas activas
        if (this.state.activeTags.length > 0) {
            newParams.set('t', this.state.activeTags.join(','));
        }
        
        // Proyecto actual
        if (this.elements.overlay.classList.contains('active') && this.state.currentProjectIndex >= 0) {
            newParams.set('project', this.state.filteredProjects[this.state.currentProjectIndex].id);
        }
        
        // Actualizar urlParams para uso interno
        this.state.urlParams = newParams;
        
        // Generar URL optimizada
        const baseUrl = window.location.pathname;
        const queryString = this.buildOptimizedQueryString(newParams);
        
        if (pushState) {
            history.pushState({ path: baseUrl + queryString }, '', baseUrl + queryString);
        } else {
            history.replaceState({ path: baseUrl + queryString }, '', baseUrl + queryString);
        }
    }

    buildOptimizedQueryString(params) {
        const parts = [];
        let projectId = null;
        
        // Extraer ID de proyecto si existe
        if (params.has('project')) {
            projectId = params.get('project');
            params.delete('project');
        }
        
        // Crear string de parámetros optimizado
        const paramParts = [];
        
        // Primero agregar ordenación si no es la predeterminada
        const sortValue = params.get('s') || this.elements.sortSelect.value;
        if (sortValue && sortValue !== CONFIG.DEFAULT_SORT) {
            paramParts.push(`s=${sortValue}`);
        }
        params.delete('s');
        
        // Luego búsqueda
        if (params.has('q')) {
            paramParts.push(`q=${params.get('q')}`);
        }
        params.delete('q');
        
        // Después tags
        if (params.has('t')) {
            paramParts.push(`t=${params.get('t')}`);
        }
        params.delete('t');
        
        // Finalmente, cualquier otro parámetro
        for (const [key, value] of params.entries()) {
            paramParts.push(`${key}=${value}`);
        }
        
        // Construir URL final
        if (projectId) {
            parts.push(projectId);
        }
        
        if (paramParts.length > 0) {
            parts.push(...paramParts);
        }
        
        return parts.length > 0 ? '?' + parts.join('&') : '';
    }
    // Método para añadir al ProjectsUI
    setupImageGallery() {
        // Crear contenedor de imagen en pantalla completa
        this.fullscreenContainer = document.createElement('div');
        this.fullscreenContainer.id = 'fullscreen-container';
        this.fullscreenContainer.style = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease;
            z-index: 9999;
        `;
        document.body.appendChild(this.fullscreenContainer);

        // Botón anterior
        this.prevImageBtn = document.createElement('button');
        this.prevImageBtn.id = 'prev-image';
        this.prevImageBtn.innerHTML = '&lt;';
        this.prevImageBtn.style = `
            position: absolute;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 24px;
            cursor: pointer;
            transition: background-color 0.3s;
        `;

        // Botón siguiente
        this.nextImageBtn = document.createElement('button');
        this.nextImageBtn.id = 'next-image';
        this.nextImageBtn.innerHTML = '&gt;';
        this.nextImageBtn.style = `
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 24px;
            cursor: pointer;
            transition: background-color 0.3s;
        `;

        // Contador de imágenes
        this.imageCounter = document.createElement('div');
        this.imageCounter.id = 'image-counter';
        this.imageCounter.style = `
            position: absolute;
            bottom: 20px;
            left: 0;
            right: 0;
            text-align: center;
            color: white;
            font-size: 16px;
            padding: 10px;
        `;

        // Imagen en pantalla completa
        this.fullscreenImage = document.createElement('img');
        this.fullscreenImage.id = 'fullscreen-image';
        this.fullscreenImage.style.maxWidth = '90%';
        this.fullscreenImage.style.maxHeight = '90%';
        this.fullscreenImage.style.objectFit = 'contain';

        // Añadir elementos al contenedor
        this.fullscreenContainer.appendChild(this.prevImageBtn);
        this.fullscreenContainer.appendChild(this.nextImageBtn);
        this.fullscreenContainer.appendChild(this.imageCounter);
        this.fullscreenContainer.appendChild(this.fullscreenImage);

        // Estado de la galería
        this.currentImageIndex = 0;
        this.galleryImages = [];

        // Configurar eventos
        this.setupImageGalleryEvents();
    }

    setupImageGalleryEvents() {
        // Abrir imagen en pantalla completa
        this.elements.popupContent.addEventListener('click', (e) => {
            const clickedImage = e.target.closest('.popup-gallery img');
            if (clickedImage) {
                this.openFullscreenImage(clickedImage.src);
            }
        });

        // Botones de navegación
        this.prevImageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showPreviousImage();
        });

        this.nextImageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showNextImage();
        });

        // Cerrar imagen con tecla Escape
        document.addEventListener('keydown', (e) => {
            if (this.fullscreenContainer.style.visibility === 'visible') {
                if (e.key === 'Escape') this.closeFullscreenImage();
                if (e.key === 'ArrowLeft') this.showPreviousImage();
                if (e.key === 'ArrowRight') this.showNextImage();
            }
        });

        // Cerrar al hacer clic fuera de la imagen
        this.fullscreenContainer.addEventListener('click', (e) => {
            if (e.target === this.fullscreenContainer) {
                this.closeFullscreenImage();
            }
        });

        // Prevenir que la imagen cierre el visor
        this.fullscreenImage.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    openFullscreenImage(src) {
        // Obtener todas las imágenes de la galería
        this.galleryImages = Array.from(
            this.elements.popupContent.querySelectorAll('.popup-gallery img')
        ).map(img => img.src);
        
        // Encontrar el índice de la imagen actual
        this.currentImageIndex = this.galleryImages.indexOf(src);
        
        // Establecer imagen
        this.fullscreenImage.src = src;
        
        // Mostrar contador
        this.updateImageCounter();
        
        // Mostrar contenedor
        this.fullscreenContainer.style.opacity = '1';
        this.fullscreenContainer.style.visibility = 'visible';
        
        // Bloquear scroll
        document.body.style.overflow = 'hidden';
        
        // Actualizar botones de navegación
        this.updateNavigationButtons();
    }

    updateImageCounter() {
        this.imageCounter.textContent = `${this.currentImageIndex + 1} / ${this.galleryImages.length}`;
    }

    updateNavigationButtons() {
        // Botón anterior
        this.prevImageBtn.disabled = this.currentImageIndex === 0;
        this.prevImageBtn.style.opacity = this.currentImageIndex === 0 ? '0' : '1';
        this.prevImageBtn.style.cursor = this.currentImageIndex === 0 ? 'default' : 'pointer';
        
        // Botón siguiente
        this.nextImageBtn.disabled = this.currentImageIndex === this.galleryImages.length - 1;
        this.nextImageBtn.style.opacity = this.currentImageIndex === this.galleryImages.length - 1 ? '0' : '1';
        this.nextImageBtn.style.cursor = this.currentImageIndex === this.galleryImages.length - 1 ? 'default' : 'pointer';
    }

    showPreviousImage() {
        if (this.currentImageIndex > 0) {
            this.currentImageIndex--;
            this.fullscreenImage.src = this.galleryImages[this.currentImageIndex];
            this.updateImageCounter();
            this.updateNavigationButtons();
        }
    }

    showNextImage() {
        if (this.currentImageIndex < this.galleryImages.length - 1) {
            this.currentImageIndex++;
            this.fullscreenImage.src = this.galleryImages[this.currentImageIndex];
            this.updateImageCounter();
            this.updateNavigationButtons();
        }
    }

    closeFullscreenImage() {
        this.fullscreenContainer.style.opacity = '0';
        setTimeout(() => {
            this.fullscreenContainer.style.visibility = 'hidden';
        }, 300);
        
        // Restaurar scroll
        document.body.style.overflow = '';
    }
}

// Main Application Controller
class ProjectsApp {
    constructor() {
        this.state = new ProjectsState();
        this.ui = new ProjectsUI(this.state);
        // Guardar referencia global para acceder desde otros contextos
        window.projectsAppInstance = this;
        this.loadProjectsData();
    }

    async loadProjectsData() {
        try {
            const response = await fetch(CONFIG.URLS.PROJECTS_DATA);
            if (!response.ok) {
                throw new Error('Could not load projects data');
            }
            const projectsData = await response.json();
            this.initialize(projectsData);
        } catch (error) {
            console.error('Error loading data:', error);
            this.initialize([]);
        }
    }

    initialize(projectsData) {
        this.state.initializeProjects(projectsData);
        this.ui.processUrlParams();
        this.ui.generateTagFilters();
        this.ui.checkUrlForProject();
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => new ProjectsApp());