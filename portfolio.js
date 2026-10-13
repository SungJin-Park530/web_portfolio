document.addEventListener('DOMContentLoaded', () => {
  const projectList = document.querySelector('#project-list');
  const filterButtons = [...document.querySelectorAll('.filter-tabs button[data-category]')];
  let projects = [];
  let activeCategory = 'all';
  const modal = document.querySelector('#project-modal');
  const closeButton = modal.querySelector('.modal-close');
  const modalScrollContent = modal.querySelector('.modal-scroll-content');
  const modalTitle = document.querySelector('#modal-title');
  const modalAddress = document.querySelector('#explorer-address');
  const modalRole = document.querySelector('#modal-role');
  const modalDuration = document.querySelector('#modal-duration');
  const modalContent = document.querySelector('#modal-content');
  const modalVideo = modal.querySelector('.modal-video');
  const modalTechStack = document.querySelector('#modal-tech-stack');
  const modalTags = document.querySelector('#modal-tags');
  const modalLinks = modal.querySelectorAll('.modal-actions a');
  const wizardHeading = document.querySelector('#wizard-heading');
  const wizardDescription = document.querySelector('#wizard-description');
  const wizardBanner = document.querySelector('.wizard-banner');
  const notepadModal = document.querySelector('#notepad-modal');
  const notepadCloseButton = notepadModal.querySelector('.notepad-close');
  const notepadOpenButton = document.querySelector('#open-notepad');
  const trayClock = document.querySelector('#tray-clock');
  let lastOpenedProjectKey = null;
  let lastModalScrollTop = 0;

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const list = (value) => Array.isArray(value) ? value : [];

  const categories = (value) => (Array.isArray(value) ? value : [value])
    .filter((item) => typeof item === 'string' && item.trim());

  const renderCategories = (value) => categories(value)
    .map((item) => `<span class="category">${escapeHtml(item)}</span>`)
    .join('');

  const normalizeAssetPath = (value) => String(value ?? '').replace(/(?:\.\.\/)+assets\//g, './assets/');

  const getYouTubeVideoId = (value) => {
    try {
      const url = new URL(value);
      const host = url.hostname.replace(/^www\./, '');
      if (host === 'youtu.be') return url.pathname.slice(1).split('/')[0];
      if (!['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) return '';
      if (url.pathname === '/watch') return url.searchParams.get('v') || '';
      return url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] || '';
    } catch {
      return '';
    }
  };

  const renderYouTubePlayer = (container, videoUrl, title) => {
    const videoId = getYouTubeVideoId(videoUrl);
    if (!/^[\w-]{11}$/.test(videoId)) {
      container.classList.remove('has-video');
      container.innerHTML = '<span>→</span>';
      return;
    }

    const frame = document.createElement('iframe');
    const origin = encodeURIComponent(window.location.origin);
    frame.className = 'youtube-player';
    frame.title = title;
    frame.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${origin}`;
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    frame.loading = 'lazy';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    container.classList.add('has-video');
    container.replaceChildren(frame);
  };

  const pauseCardVideos = () => {
    projectList.querySelectorAll('.youtube-player').forEach((frame) => {
      frame.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
        'https://www.youtube.com'
      );
    });
  };

  const showDemoUnavailable = (button) => {
    const wrapper = button.parentElement;
    wrapper.querySelector('.demo-tooltip')?.remove();
    const tooltip = document.createElement('span');
    tooltip.className = 'demo-tooltip';
    tooltip.setAttribute('role', 'status');
    tooltip.textContent = '이 프로젝트는 배포된 내역이 없습니다.';
    wrapper.append(tooltip);
    window.setTimeout(() => tooltip.remove(), 2600);
  };

  const showEmptyState = () => {
    projectList.innerHTML = '<p class="project-list-status">등록된 프로젝트가 없습니다.</p>';
  };

  const renderProjects = () => {
    const visibleProjects = activeCategory === 'all'
      ? projects
      : projects.filter((project) => categories(project.category).includes(activeCategory));

    if (visibleProjects.length === 0) {
      projectList.innerHTML = '<p class="project-list-status">해당 분류의 프로젝트가 없습니다.</p>';
      return;
    }

    projectList.innerHTML = visibleProjects.map(renderCard).join('');
    projectList.querySelectorAll('.dynamic-media-placeholder').forEach((container, index) => {
      renderYouTubePlayer(container, visibleProjects[index].videoUrl, `${visibleProjects[index].title || 'Project'} video`);
    });
    bindCardEvents(visibleProjects);
  };

  const parseMarkdownFile = (text, path) => {
    const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);
    if (!match) throw new Error(`Frontmatter not found: ${path}`);

    const frontmatter = window.jsyaml.load(match[1]) || {};
    return {
      ...frontmatter,
      sourcePath: path,
      body: match[2].trim()
    };
  };

  const loadWizardContent = async () => {
    const path = './content/wizard/setup.md';
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Wizard content request failed: ${response.status}`);

      const content = parseMarkdownFile(await response.text(), path);
      if (typeof content.title !== 'string' || !content.title.trim()) {
        throw new Error(`Wizard title not found: ${path}`);
      }
      if (!content.body) throw new Error(`Wizard description is empty: ${path}`);

      wizardHeading.textContent = content.title;
      wizardDescription.innerHTML = window.marked.parse(content.body);

      if (content.bannerImage !== undefined && typeof content.bannerImage !== 'string') {
        throw new Error(`Wizard banner image path must be a string: ${path}`);
      }

      const bannerImagePath = content.bannerImage?.trim();
      if (bannerImagePath) {
        const contentUrl = new URL(response.url || path, document.baseURI);
        const bannerDirectory = new URL('.', contentUrl);
        const bannerUrl = new URL(bannerImagePath, contentUrl);
        if (bannerUrl.origin !== bannerDirectory.origin || !bannerUrl.pathname.startsWith(bannerDirectory.pathname)) {
          throw new Error(`Wizard banner image must be inside ${bannerDirectory.pathname}`);
        }

        const image = document.createElement('img');
        image.className = 'wizard-banner-image';
        image.alt = '';
        image.addEventListener('error', () => {
          console.error(`Unable to load wizard banner image: ${bannerUrl.href}`);
          image.remove();
          const errorMessage = document.createElement('span');
          errorMessage.className = 'wizard-banner-error';
          errorMessage.textContent = '배너 이미지를 불러오지 못했습니다.';
          wizardBanner.append(errorMessage);
        }, { once: true });
        image.src = bannerUrl.href;
        wizardBanner.replaceChildren(image);
      }
    } catch (error) {
      console.error('Unable to load wizard content:', error);
      const errorMessage = document.createElement('p');
      errorMessage.className = 'wizard-load-error';
      errorMessage.setAttribute('role', 'alert');
      errorMessage.textContent = '설치 마법사 내용을 불러오지 못했습니다.';
      wizardDescription.append(errorMessage);
    }
  };

  const renderCard = (project, index) => {
    const highlights = list(project.highlights);
    const techStack = list(project.techStack);
    const showRole = categories(project.category).includes('팀 프로젝트') && project.role;
    const roleMarkup = showRole ? `<h4>ROLE</h4><p class="project-role">${escapeHtml(project.role)}</p>` : '';

    return `
      <article class="project-card project-window" tabindex="0" role="button" aria-label="Open ${escapeHtml(project.title)} project details" data-project-index="${index}">
        <div class="project-window-titlebar">
          <span class="project-window-icon" aria-hidden="true"></span>
          <h3>${escapeHtml(project.title)}</h3>
          <span class="project-window-controls" aria-hidden="true"><span>_</span><span>□</span><span>X</span></span>
        </div>
        <div class="project-window-content">
          <div class="project-topline"><div class="category-list">${renderCategories(project.category)}</div><span class="date">${escapeHtml(project.period)}</span></div>
          <div class="project-body">
            <div class="video-placeholder dynamic-media-placeholder" aria-label="YouTube video placeholder"><span>▶</span></div>
            <div class="project-info">
              <h4>SUMMARY</h4>
              <p>${escapeHtml(project.summary)}</p>
              ${roleMarkup}
              <h4>KEY HIGHLIGHTS</h4>
              <ul>${highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
              <h4>TECH STACK</h4>
              <div class="tech-tags">${techStack.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div>
              <div class="card-actions">
                <span class="demo-action"><a class="live-button" href="${escapeHtml(project.demoUrl || '#')}">Demo</a></span>
                <a class="github-button" href="${escapeHtml(project.githubUrl || '#')}" target="_blank" rel="noreferrer">GitHub</a>
                <button class="details-button" type="button">상세보기</button>
              </div>
            </div>
          </div>
        </div>
      </article>`;
  };

  const openModal = (project) => {
    pauseCardVideos();
    if (!notepadModal.hidden) closeNotepad();
    const projectKey = String(project.sourcePath || project.title || 'project');
    const shouldRestoreScroll = projectKey === lastOpenedProjectKey;
    modalScrollContent.scrollTop = shouldRestoreScroll ? lastModalScrollTop : 0;
    lastOpenedProjectKey = projectKey;
    lastModalScrollTop = shouldRestoreScroll ? lastModalScrollTop : 0;
    const filename = String(project.sourcePath || 'project.md').split(/[\\/]/).pop();
    const projectPath = `C:\\Projects\\${filename}`;
    const projectTitle = project.title || filename.replace(/\.md$/i, '');
    modalTitle.textContent = `C:\\Projects\\${projectTitle}.md - Explorer`;
    modalAddress.value = projectPath;
    modalRole.textContent = project.role || 'N/A';
    modalDuration.textContent = project.period || '-';
    const markdownBody = normalizeAssetPath(project.body || '');
    modalContent.innerHTML = window.marked.parse(markdownBody);
    renderMermaidDiagrams().catch((error) => console.error('Unable to render Mermaid diagram:', error));
    modalTechStack.innerHTML = list(project.techStack)
      .map((item) => `<span>${escapeHtml(item)}</span>`)
      .join('');
    modalTags.innerHTML = list(project.tags)
      .map((item) => `<span>${escapeHtml(item)}</span>`)
      .join('');
    renderYouTubePlayer(modalVideo, project.videoUrl, `${project.title || 'Project'} video`);
    modalLinks[0].href = project.demoUrl || '#';
    modalLinks[0].dataset.demoUrl = project.demoUrl || '';
    modalLinks[1].href = project.githubUrl || 'https://github.com';
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    closeButton.focus();
  };

  const closeModal = () => {
    lastModalScrollTop = modalScrollContent.scrollTop;
    modal.hidden = true;
    modalVideo.replaceChildren();
    modalVideo.classList.remove('has-video');
    document.body.style.overflow = '';
  };

  const openNotepad = () => {
    if (!modal.hidden) closeModal();
    notepadModal.hidden = false;
    document.body.style.overflow = 'hidden';
    notepadCloseButton.focus();
  };

  const closeNotepad = () => {
    notepadModal.hidden = true;
    document.body.style.overflow = '';
  };

  modalScrollContent.addEventListener('scroll', () => {
    if (!modal.hidden) lastModalScrollTop = modalScrollContent.scrollTop;
  });

  window.addEventListener('pagehide', () => {
    if (!modal.hidden) closeModal();
    lastOpenedProjectKey = null;
    lastModalScrollTop = 0;
  });

  const renderMermaidDiagrams = async () => {
    const mermaidBlocks = [...modalContent.querySelectorAll('pre code.language-mermaid')];
    mermaidBlocks.forEach((codeBlock) => {
      const diagram = document.createElement('div');
      diagram.className = 'mermaid';
      diagram.textContent = codeBlock.textContent.trim();
      codeBlock.parentElement.replaceWith(diagram);
    });

    const diagrams = modalContent.querySelectorAll('.mermaid');
    if (diagrams.length > 0 && window.mermaid) {
      await window.mermaid.run({ nodes: diagrams });
    }
  };

  const bindCardEvents = (projects) => {
    projectList.querySelectorAll('.project-card').forEach((card) => {
      const openCard = () => openModal(projects[Number(card.dataset.projectIndex)]);
      card.querySelector('.dynamic-media-placeholder').addEventListener('click', (event) => {
        event.stopPropagation();
      });
      card.addEventListener('click', (event) => {
        if (event.target.closest('.dynamic-media-placeholder')) {
          event.stopPropagation();
          return;
        }
        const demoLink = event.target.closest('.live-button');
        if (demoLink) {
          const project = projects[Number(card.dataset.projectIndex)];
          if (!String(project.demoUrl || '').trim()) {
            event.preventDefault();
            showDemoUnavailable(demoLink);
          }
          return;
        }
        if (event.target.closest('.details-button')) {
          event.stopPropagation();
          openCard();
          return;
        }
        if (!event.target.closest('a')) openCard();
      });
      card.addEventListener('keydown', (event) => {
        if (event.target === card && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          openCard();
        }
      });
    });
  };

  const loadProjects = async () => {
    try {
      const indexResponse = await fetch('./projects.json');
      if (!indexResponse.ok) throw new Error(`Index request failed: ${indexResponse.status}`);
      const paths = await indexResponse.json();
      if (!Array.isArray(paths) || paths.length === 0) {
        showEmptyState();
        return;
      }

      const results = await Promise.allSettled(paths.map(async (path) => {
        const relativePath = `./${String(path).replace(/^\.\//, '')}`;
        const response = await fetch(relativePath);
        if (!response.ok) throw new Error(`Project request failed: ${response.status}`);
        return parseMarkdownFile(await response.text(), relativePath);
      }));
      projects = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);

      if (projects.length === 0) {
        showEmptyState();
        return;
      }

      renderProjects();
    } catch (error) {
      console.error('Unable to load projects:', error);
      showEmptyState();
    }
  };

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.category;
      filterButtons.forEach((filterButton) => {
        const isActive = filterButton === button;
        filterButton.classList.toggle('active', isActive);
        filterButton.setAttribute('aria-pressed', String(isActive));
      });
      if (projects.length > 0) renderProjects();
    });
  });

  document.querySelectorAll('a[href="#projects"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      document.querySelector('#projects').scrollIntoView({ behavior: 'smooth' });
    });
  });

  closeButton.addEventListener('click', closeModal);
  notepadOpenButton.addEventListener('click', openNotepad);
  notepadCloseButton.addEventListener('click', closeNotepad);
  notepadModal.addEventListener('click', (event) => {
    if (event.target === notepadModal) closeNotepad();
  });
  const updateTrayClock = () => {
    trayClock.textContent = new Intl.DateTimeFormat('ko-KR', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date());
  };
  updateTrayClock();
  window.setInterval(updateTrayClock, 1000);

  modalLinks[0].addEventListener('click', (event) => {
    if (!String(event.currentTarget.dataset.demoUrl || '').trim()) {
      event.preventDefault();
      showDemoUnavailable(event.currentTarget);
    }
  });
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!notepadModal.hidden) {
      closeNotepad();
    } else if (!modal.hidden) {
      closeModal();
    }
  });

  loadWizardContent();
  loadProjects();
});
