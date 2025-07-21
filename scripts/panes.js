
const config = {
  theme: 'system',
}

/* const ctrl = new Pane({
  title: 'Config',
  expanded: true,
}) */

const update = () => {
  document.documentElement.dataset.theme = config.theme
}

const sync = (event) => {
  if (
    !document.startViewTransition ||
    event.target.controller.view.labelElement.innerText !== 'Theme'
  )
    return update()
  document.startViewTransition(() => update())
}

/* ctrl.addBinding(config, 'theme', {
  label: 'Theme',
  options: {
    System: 'system',
    Light: 'light',
    Dark: 'dark',
  },
})

ctrl.on('change', sync)
update() */

// the one piece we need goes here
const lists = document.querySelectorAll('.projects-grid ul')

console.log('Lists found:', lists.length)

lists.forEach((list, listIndex) => {
  const items = list.querySelectorAll('li')
  
  console.log(`Grid ${listIndex + 1} - Items found:`, items.length)

  const setIndex = (event) => {
    const closest = event.target.closest('li')
    if (closest) {
      const index = [...items].indexOf(closest)
      
      // Check if we're on mobile (768px breakpoint)
      const isMobile = window.innerWidth <= 768
      
      if (isMobile) {
        // On mobile, don't change grid columns, just set active state
        items.forEach((item, i) => {
          item.dataset.active = 'true' // All items are active on mobile
        })
        return
      }
      
      // Desktop behavior - expand selected item
      const cols = new Array(list.children.length)
        .fill()
        .map((_, i) => {
          items[i].dataset.active = (index === i).toString()
          return index === i ? '10fr' : '1fr'
        })
        .join(' ')
      
      console.log(`Grid ${listIndex + 1} - Setting grid-template-columns:`, cols)
      list.style.setProperty('grid-template-columns', cols)
    }
  }
  
  list.addEventListener('focus', setIndex, true)
  list.addEventListener('click', setIndex)
  list.addEventListener('pointermove', setIndex)
  
  const resync = () => {
    const w = Math.max(
      ...[...items].map((i) => {
        return i.offsetWidth
      })
    )
    list.style.setProperty('--li-width', w)
    
    // Reset grid behavior on resize
    const isMobile = window.innerWidth <= 768
    if (isMobile) {
      items.forEach((item) => {
        item.dataset.active = 'true'
      })
      list.style.removeProperty('grid-template-columns')
    } else {
      // Reset to initial desktop state
      if (items.length > 0) {
        items[0].dataset.active = 'true'
        for (let i = 1; i < items.length; i++) {
          items[i].dataset.active = 'false'
        }
        const initialCols = new Array(list.children.length)
          .fill()
          .map((_, i) => i === 0 ? '10fr' : '1fr')
          .join(' ')
        list.style.setProperty('grid-template-columns', initialCols)
      }
    }
  }
  
  window.addEventListener('resize', resync)
  resync()

  // Set initial active state
  const isMobile = window.innerWidth <= 768
  if (isMobile) {
    // On mobile, all items are active
    items.forEach((item) => {
      item.dataset.active = 'true'
    })
  } else {
    // On desktop, first item is active
    if (items.length > 0) {
      items[0].dataset.active = 'true'
      for (let i = 1; i < items.length; i++) {
        items[i].dataset.active = 'false'
      }
      const initialCols = new Array(list.children.length)
        .fill()
        .map((_, i) => i === 0 ? '10fr' : '1fr')
        .join(' ')
      list.style.setProperty('grid-template-columns', initialCols)
    }
  }
})
