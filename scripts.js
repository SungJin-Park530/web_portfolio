document.addEventListener('DOMContentLoaded', () => {
  const projectList = document.querySelector('#project-list');
  const modal = document.querySelector('#project-modal');
  const closeButton = modal.querySelector('.modal-close');
  const modalTitle = document.querySelector('#modal-title');
  const modalCategory = document.querySelector('#modal-category');
  const modalRole = document.querySelector('#modal-role');
  const modalDuration = document.querySelector('#modal-duration');
  const modalContent = document.querySelector('#modal-content');
  const modalVideo = modal.querySelector('.modal-video');
  const modalTechStack = document.querySelector('#modal-tech-stack');
  const modalTags = document.querySelector('#modal-tags');
  const modalLinks = modal.querySelectorAll('.modal-actions a');

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const list = (value) => Array.isArray(value) ? value : [];

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
    if (!/^[\w-]{11}$/.test(videoId)) return;

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

  const showEmptyState = () => {
    projectList.innerHTML = '<p class="project-list-status">등록된 프로젝트가 없습니다.</p>';
  };

  const parseMarkdownFile = (text, path) => {
    const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);
    if (!match) throw new Error(`Frontmatter not found: ${path}`);

    const frontmatter = window.jsyaml.load(match[1]) || {};
    return {
      ...frontmatter,
      thumbnail: normalizeAssetPath(frontmatter.thumbnail),
      sourcePath: path,
      body: match[2].trim()
    };
  };

  const renderCard = (project, index) => {
    const highlights = list(project.highlights);
    const techStack = list(project.techStack);
    const category = project.category === 'AI' ? 'AI ENGINEER' : 'FULL-STACK';

    return `
      <article class="project-card" tabindex="0" role="button" aria-label="Open ${escapeHtml(project.title)} project details" data-project-index="${index}">
        <div class="project-topline"><span class="category">${category}</span><span class="date">${escapeHtml(project.period)} · ${escapeHtml(project.role)}</span></div>
        <h3>${escapeHtml(project.title)}</h3>
        <div class="project-body">
          <div class="video-placeholder dynamic-media-placeholder" aria-label="YouTube video placeholder"><span>→</span></div>
          <div class="project-info">
            <p>${escapeHtml(project.summary)}</p>
            <h4>KEY HIGHLIGHTS</h4>
            <ul>${highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
            <div class="tech-tags">${techStack.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div>
            <div class="card-actions"><a class="live-button" href="#">Live Demo ↗</a><a class="github-button" href="https://github.com" target="_blank" rel="noreferrer">◈ GitHub</a></div>
          </div>
        </div>
      </article>`;
  };

  const openModal = (project) => {
    pauseCardVideos();
    const tags = list(project.tags);
    const techStack = list(project.techStack);
    modalTitle.textContent = project.title || 'Project Details';
    modalCategory.textContent = project.role || project.category || 'PROJECT';
    modalRole.textContent = project.role || '-';
    modalDuration.textContent = project.period || '-';
    const markdownBody = normalizeAssetPath(project.body || '');
    modalContent.innerHTML = window.marked.parse(markdownBody);
    renderMermaidDiagrams().catch((error) => console.error('Unable to render Mermaid diagram:', error));
    modalTechStack.innerHTML = techStack.map((item) => `<span>${escapeHtml(item)}</span>`).join('');
    modalTags.innerHTML = tags.map((item) => `<span>${escapeHtml(item)}</span>`).join('');
    renderYouTubePlayer(modalVideo, project.videoUrl, `${project.title || 'Project'} video`);
    modalLinks[0].href = project.videoUrl || '#';
    modalLinks[1].href = project.githubUrl || 'https://github.com';
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    closeButton.focus();
  };

  const closeModal = () => {
    modal.hidden = true;
    modalVideo.replaceChildren();
    modalVideo.classList.remove('has-video');
    document.body.style.overflow = '';
  };

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
      card.addEventListener('click', (event) => {
        if (!event.target.closest('a')) openCard();
      });
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
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
      const projects = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value)
        .sort((a, b) => Number(a.order || 9999) - Number(b.order || 9999));

      if (projects.length === 0) {
        showEmptyState();
        return;
      }

      projectList.innerHTML = projects.map(renderCard).join('');
      projectList.querySelectorAll('.dynamic-media-placeholder').forEach((container, index) => {
        renderYouTubePlayer(container, projects[index].videoUrl, `${projects[index].title || 'Project'} video`);
      });
      bindCardEvents(projects);
    } catch (error) {
      console.error('Unable to load projects:', error);
      showEmptyState();
    }
  };

  document.querySelectorAll('a[href="#projects"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      document.querySelector('#projects').scrollIntoView({ behavior: 'smooth' });
    });
  });

  closeButton.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) closeModal();
  });

  loadProjects();
});
