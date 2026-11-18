(() => {
  const nav = document.querySelector('.site-header .site-nav, .top .site-nav');
  if (!nav) return;

  const links = [...nav.querySelectorAll('a')];
  const indicator = nav.querySelector('.site-nav__indicator');
  const active = nav.querySelector('a[aria-current="page"]');
  if (!indicator) return;

  const place = (link, animate) => {
    const navBox = nav.getBoundingClientRect();
    const linkBox = link.getBoundingClientRect();
    indicator.style.transition = animate ? '' : 'none';
    indicator.style.width = `${linkBox.width}px`;
    indicator.style.transform = `translateX(${linkBox.left - navBox.left}px)`;
    indicator.style.opacity = '1';
    if (!animate) requestAnimationFrame(() => { indicator.style.transition = ''; });
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (active) place(active, false);

  links.forEach((link) => link.addEventListener('click', (event) => {
    if (link === active || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    place(link, !reducedMotion);
    window.setTimeout(() => window.location.assign(link.href), reducedMotion ? 0 : 430);
  }));

  window.addEventListener('resize', () => {
    const current = nav.querySelector('a[aria-current="page"]');
    if (current) place(current, false);
  });
})();

/* Local media first: replaces archived external photos with files bundled in this build.
   New cards created by filters are handled through MutationObserver as well. */
(() => {
  const loader=document.createElement('script');
  loader.src='local-media.js';
  loader.async=false;

  loader.addEventListener('load',()=>{
    const local=window.localMedia;
    if(typeof local!=='function')return;

    const replaceValue=value=>local(value)||value;
    const remapData=()=>{
      (window.EURO_REPORTS||[]).forEach(report=>{
        const cover=report[3]&&replaceValue(report[3]);
        if(cover)report[3]=cover;
        if(Array.isArray(report[5]))report[5]=report[5].map(url=>{
          const replacement=replaceValue(url);
          return replacement===url&&cover?cover:replacement;
        });
      });
      (window.EURO_OFFICIAL_WORKS||[]).forEach(group=>{
        if(Array.isArray(group.images))group.images=group.images.map(replaceValue);
      });
    };

    const hydrateImage=image=>{
      if(!(image instanceof HTMLImageElement))return;
      const source=image.getAttribute('src');
      const replacement=source&&replaceValue(source);
      if(replacement&&replacement!==source)image.setAttribute('src',replacement);
      image.decoding='async';
      if(!image.hasAttribute('loading'))image.loading='lazy';
      if(image.matches('.page-hero img, .report-main-image, .detail-art img'))image.fetchPriority='high';
      if(!image.dataset.localFallback){
        image.dataset.localFallback='true';
        image.addEventListener('error',()=>{
          if(image.dataset.fallbackApplied)return;
          image.dataset.fallbackApplied='true';
          image.src='assets/hero-timber-home.png';
        });
      }
    };
    const hydrateBackground=element=>{
      const value=element.style.backgroundImage;
      if(!value)return;
      element.style.backgroundImage=value.replace(/url\(["']?([^"')]+)["']?\)/g,(match,url)=>{
        const replacement=replaceValue(url);
        return replacement===url?match:`url("${replacement}")`;
      });
    };
    const hydrate=root=>{
      if(root instanceof HTMLImageElement)hydrateImage(root);
      if(root instanceof HTMLElement){
        hydrateBackground(root);
        if(root.dataset.officialImage)root.dataset.officialImage=replaceValue(root.dataset.officialImage);
      }
      if(!(root instanceof Element))return;
      root.querySelectorAll?.('img').forEach(hydrateImage);
      root.querySelectorAll?.('[style*="background"]').forEach(hydrateBackground);
      root.querySelectorAll?.('[data-official-image]').forEach(element=>{element.dataset.officialImage=replaceValue(element.dataset.officialImage);});
    };

    remapData();
    hydrate(document.documentElement);
    new MutationObserver(records=>records.forEach(record=>{
      record.addedNodes.forEach(hydrate);
      if(record.type==='attributes')hydrate(record.target);
    })).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src','style']});
  });
  document.head.append(loader);
})();
