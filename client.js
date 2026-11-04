window.__ModuleLoader__.load({
  id: '@local/dsh-ui-declutter',
  factory(require) {
    const React = require('react')
    const { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } = React
    const h = React.createElement

    let createPortal = null
    try {
      const ReactDOM = require('react-dom')
      if (ReactDOM !== null && typeof ReactDOM.createPortal === 'function') {
        createPortal = ReactDOM.createPortal
      }
    } catch {
      createPortal = null
    }

    const RADIUS = 5.5
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS
    
    const FADE_MS = 160
    
    const CHIP_DWELL_MS = 140
    
    const BAR_DWELL_MS = 500
    
    const DISMISS_MS = 100

    // calculate context usage
    function occupancy(pressure) {
      const used = pressure?.projectedTokens ?? pressure?.pressureTokens
      if (used === undefined || pressure?.contextWindow === undefined) return null
      return {
        percent: Math.min(100, Math.round(used / pressure.contextWindow * 100)),
        usedTokens: used,
        contextWindow: pressure.contextWindow,
      }
    }

    // format token counts
    function fmt(value) {
      if (value < 1000) return String(value)
      if (value < 1000000) return `${Math.round(value / 100) / 10}K`
      return `${Math.round(value / 100000) / 10}M`
    }

    const ROWS = [
      { key: 'systemTokens', label: 'System', color: 'var(--dsw-static-neutral-bluish-400, var(--dsw-alias-label-tertiary))' },
      { key: 'toolsTokens', label: 'Tools', color: 'rgb(167, 139, 250)' },
      { key: 'messageTokens', label: 'Messages', color: 'var(--dsw-static-blue-450, var(--dsw-alias-label-tertiary))' },
    ]

    const STYLE_TEXT = [
      '.dsh-uideclutter-chip{color:var(--dsw-alias-label-tertiary);transition:background-color 160ms ease,color 160ms ease}',
      '.dsh-uideclutter-chip:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}',
      '.dsh-uideclutter-chip:hover .dsh-uideclutter-ring-fill{stroke:var(--dsw-alias-label-secondary)}',
      '.dsh-uideclutter-chip:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-uideclutter-bar:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;border-radius:6px}',

      '.dsh-uideclutter-surface{opacity:0;transform:translateY(4px);transition:opacity 160ms ease,transform 160ms ease}',
      '.dsh-uideclutter-surface[data-shown="true"]{opacity:1;transform:translateY(0)}',
      '@media (prefers-reduced-motion: reduce){.dsh-uideclutter-surface{transition:none;transform:none}}',

      '[class*="newSession"]{display:none !important}',

      '[class*="brandName"]{display:none !important}',

      '[class*="sectionLabel"]{cursor:default;user-select:none}',
      '[class*="sectionHeader"] [class*="searchSlot"],[class*="sectionHeader"] [class*="headerActions"]{opacity:0;pointer-events:none;transition:opacity 140ms ease}',
      '[class*="sectionHeader"]:hover [class*="searchSlot"],[class*="sectionHeader"]:hover [class*="headerActions"],[class*="sectionHeader"] [class*="searchSlot"]:focus-within,[class*="sectionHeader"] [class*="headerActions"]:focus-within{opacity:1;pointer-events:auto}',
      '.dsh-uideclutter-dialogrow{padding:9px 10px;font-size:12px;color:var(--dsw-alias-label-tertiary)}',
      '.dsh-uideclutter-menuitem{display:flex;align-items:center;gap:8px;width:100%;min-height:32px;padding:0 10px;border:none;background:transparent;color:inherit;font:inherit;font-size:13px;text-align:left;cursor:pointer;border-radius:var(--dsw-radius-sm,4px)}',
      '.dsh-uideclutter-menuicon{display:inline-flex;flex:none;width:16px;height:16px;margin-left:-1px;align-items:center;justify-content:center;color:var(--dsw-alias-label-secondary)}',
      '.dsh-uideclutter-menuitem:hover,.dsh-uideclutter-menuitem:focus-visible{background:var(--dsw-alias-interactive-bg-hover)}',
      '.dsh-uideclutter-newchat{color:var(--dsw-alias-label-secondary);transition:background-color 140ms ease,color 140ms ease}',
      '.dsh-uideclutter-newchat:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.dsh-uideclutter-newchat:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',

      '[data-slot="sidebar.workspaces.session.row.action"]{display:none !important}',

      '[class*="sessionRow"] [class*="time"]{display:none !important}',
      '[class*="sessionRow"]{height:28px !important}',
      '[class*="sessionRow"] [class*="title"]{font-size:13px !important;line-height:18px !important}',

      '[aria-label="Plugins"],[aria-label="More"]{display:none !important}',

      '[class*="logoRow"] button[class*="brand"]{width:fit-content !important;flex:0 0 auto !important;padding-inline:4px !important;margin-inline-end:auto !important}',
      
      '[class*="logoRow"]{justify-content:flex-start !important}',
      
      '[aria-label="Account menu"]{width:fit-content !important;height:34px !important;padding:2px 6px !important;border-radius:var(--dsw-radius-sm, 4px) !important;cursor:default !important}',

      '[class*="_frame"]:has(> [class*="_sidebarCol"]){transition:grid-template-columns var(--ds-transition-duration-slow) var(--ds-ease-in-out)}',
      '[class*="_frame"][data-dragging]:has(> [class*="_sidebarCol"]){transition:none}',
      '@media (prefers-reduced-motion:reduce){[class*="_frame"]:has(> [class*="_sidebarCol"]){transition:none}}',
      '[class*="_sidebarCol"]{position:relative}',
      '.dsh-sidebar-exit-snapshot{position:absolute !important;inset:0 auto 0 0;pointer-events:none;z-index:2;overflow:hidden}',
      '.dsh-sidebar-exit-snapshot [class*="_wide"]{animation:none !important}',
      '.dsh-codex-model-trigger{display:inline-flex;align-items:center;gap:6px;border:0;border-radius:999px;corner-shape:round;background:transparent;color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;font-weight:500;line-height:20px;padding:4px 8px;cursor:default}',
      '.dsh-codex-model-trigger:hover,.dsh-codex-model-trigger[aria-expanded="true"]{background:rgba(255,255,255,.08)}',
      '.dsh-codex-model-trigger .dsh-codex-effort{color:var(--dsw-alias-label-secondary)}',
      '.dsh-codex-menu{position:fixed;z-index:1000;box-sizing:border-box;width:250px;max-width:calc(100vw - 16px);max-height:min(420px,calc(100vh - 16px));overflow:auto;padding:6px;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.12));border-radius:14px;corner-shape:round;background:var(--dsw-alias-bg-elevated,#303032);box-shadow:0 8px 24px #0005;color:var(--dsw-alias-label-primary);font:400 14px/20px system-ui,sans-serif}',
      '.dsh-codex-menu-label{padding:6px 9px;color:var(--dsw-alias-label-tertiary);font-size:13px}',
      '.dsh-codex-menu-row{display:flex;align-items:center;gap:8px;width:100%;min-height:34px;padding:6px 9px;border:0;border-radius:8px;background:transparent;color:inherit;text-align:left;font:inherit}',
      '.dsh-codex-menu-row:hover,.dsh-codex-menu-row:focus-visible{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08));outline:none}',
      '.dsh-codex-menu-row span:first-child{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dsh-codex-menu-divider{height:1px;background:var(--dsw-alias-border-l1,rgba(255,255,255,.12));margin:5px 8px}',
      '.dsh-codex-effort-heading{position:relative;display:flex;min-height:35px;align-items:flex-start;justify-content:center;text-align:center}',
      '.dsh-codex-effort-title{color:#3b82f6;font-size:14px;font-weight:600;line-height:16px}',
      '.dsh-codex-effort-model{display:block;margin:0 auto;padding:0;border:0;background:none;color:#aaa;font:12px/16px system-ui,sans-serif;cursor:pointer}',
      '.dsh-codex-effort-model .dsh-codex-chevron{vertical-align:middle;margin-left:2px}',
      '.dsh-codex-chevron{display:inline-block;flex:none;color:#999;vertical-align:middle}',
      '.dsh-codex-slider-wrap{position:relative;margin-top:11px;height:24px;border-radius:999px;background:linear-gradient(to right,#3b82f6 0%,#3b82f6 var(--effort-progress),#3f3f3f var(--effort-progress),#3f3f3f 100%)}',
      '.dsh-codex-slider-dots{position:absolute;inset:0 12px;display:flex;align-items:center;justify-content:space-between;pointer-events:none}',
      '.dsh-codex-slider-dots i{width:4px;height:4px;border-radius:50%;background:#858585}.dsh-codex-slider-dots.is-blue i{background:#84b7ff}',
      '.dsh-codex-permission-menu{width:410px}',
      '.dsh-codex-permission-menu .dsh-codex-menu-row{min-height:56px;align-items:center}',
      '.dsh-codex-permission-menu .dsh-codex-permission-icon:first-child{flex:0 0 22px;color:var(--dsw-alias-label-secondary);display:flex;align-items:center;justify-content:center}',
      '.dsh-codex-permission-copy{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}',
      '.dsh-codex-permission-copy small{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:17px;white-space:normal}',
      '.dsh-codex-permission-menu button:disabled{opacity:.48}',
      '.dsh-codex-confirm-backdrop{position:fixed;inset:0;z-index:1100;background:#0008;display:grid;place-items:center}',
      '.dsh-codex-confirm{width:min(410px,calc(100vw - 32px));padding:20px;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.12));border-radius:14px;background:var(--dsw-alias-bg-elevated,#303032);color:var(--dsw-alias-label-primary);box-shadow:0 8px 24px #0006;font:14px/1.5 system-ui,sans-serif}',
      '.dsh-codex-confirm-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}',
      '.dsh-codex-confirm-actions button{padding:7px 12px;border:0;border-radius:8px;background:rgba(255,255,255,.1);color:inherit;font:inherit}',

      ':root{--dsh-motion-ease:cubic-bezier(0.2,0,0,1);--dsh-motion-ease-out:cubic-bezier(0.22,1,0.36,1);--dsh-motion-ease-in:cubic-bezier(0.4,0,1,1);--dsh-motion-fast:120ms;--dsh-motion-base:180ms;--dsh-motion-slow:260ms}',

      'button,[role="menuitem"],[role="treeitem"],[role="button"],[role="option"],[role="tab"],[role="switch"],a,[class*="sessionRow"],[class*="projectRow"],[class*="iconButton"]{transition:background-color 110ms ease-out,color 110ms ease-out,border-color 110ms ease-out}',

      '@keyframes dsh-uideclutter-pop{from{opacity:0}to{opacity:1}}',
      '[role="menu"],[role="listbox"]{animation:dsh-uideclutter-pop 120ms ease-out}',

      '[aria-label^="Session actions for"]{visibility:hidden !important}',
      '[role="dialog"]{animation:dsh-uideclutter-pop 160ms ease-out}',
      '@keyframes dsh-codex-picker-open{from{opacity:0;transform:translateY(12px) scale(.97);filter:blur(5px)}to{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}}',
      '.dsh-codex-picker[role]{padding:0;width:246px;border-radius:16px;background:#262626;border-color:#424242;overflow:hidden;transform-origin:bottom center;animation:dsh-codex-picker-open 340ms cubic-bezier(.16,1,.3,1) both;transition:height 360ms cubic-bezier(.22,1,.36,1)}',
      '.dsh-codex-picker-pane{position:absolute;inset:auto 0 0;max-height:100%;overflow-y:auto;opacity:0;transform:translateY(10px);filter:blur(3px);pointer-events:none;transition:opacity 180ms ease,transform 340ms cubic-bezier(.22,1,.36,1),filter 240ms ease}',
      '.dsh-codex-picker-pane.is-active{opacity:1;transform:translateY(0);filter:blur(0);pointer-events:auto;transition-delay:70ms}',
      '.dsh-codex-picker-effort{padding:11px}.dsh-codex-picker-model{padding:6px}',
      '.dsh-codex-effort-select{display:block;margin:-4px auto;padding:4px 12px;border:0;border-radius:6px!important;corner-shape:round!important;background:transparent;text-align:center;cursor:default!important}',
      '.dsh-codex-effort-select *, .dsh-codex-slider-wrap, .dsh-codex-slider-wrap *{cursor:default!important}',
      '.dsh-codex-effort-select:hover,.dsh-codex-effort-select:focus-visible{background:#414141;outline:none}',
      '.dsh-codex-model-trigger{font-weight:400!important;gap:4px;transition:none!important;line-height:20px}',
      '.dsh-codex-model-trigger .dsh-codex-effort{color:#919195!important;font-weight:400!important}',
      '.dsh-codex-model-trigger svg{display:block;flex:none}',
      '.dsh-codex-model-trigger span{font-weight:400!important;line-height:20px}',
      '.dsh-codex-effort-select,.dsh-codex-picker .dsh-codex-menu-row{transition:none!important}',
      '.dsh-codex-slider-wrap{touch-action:none;cursor:default!important;border-radius:999px!important;corner-shape:round!important}',
      '.dsh-codex-slider-fill{position:absolute;inset:0 auto 0 0;width:calc(13.5px + (100% - 27px)*var(--slider-pos));border-radius:999px!important;corner-shape:round!important;background:#3b82f6;transition:none}',
      '.dsh-codex-slider-thumb{position:absolute;top:50%;left:calc(13.5px + (100% - 27px)*var(--slider-pos));width:27px;height:27px;box-sizing:border-box;border:1px solid #ddd;border-radius:50%!important;corner-shape:round!important;background:#fff;box-shadow:0 1px 3px #0004;transform:translate(-50%,-50%);transition:none;pointer-events:none}',
      '.dsh-codex-slider-dots i{border-radius:50%!important;corner-shape:round!important;transition:transform 170ms cubic-bezier(.22,1,.36,1)}.dsh-codex-slider-dots i.selected{transform:scale(1.8)}',
      '.dsh-codex-slider-dots.is-blue{clip-path:inset(0 calc((100% - 3px) * (1 - var(--slider-pos))) 0 0)}',
      '.dsh-codex-slider-wrap.is-settling .dsh-codex-slider-thumb{transition:left 380ms cubic-bezier(.22,1,.36,1)}.dsh-codex-slider-wrap.is-settling .dsh-codex-slider-fill{transition:width 380ms cubic-bezier(.22,1,.36,1)}.dsh-codex-slider-wrap.is-settling .dsh-codex-slider-dots.is-blue{transition:clip-path 380ms cubic-bezier(.22,1,.36,1)}',
      '.dsh-codex-slider-wrap:focus-visible{outline:2px solid #8ab4ff;outline-offset:3px}',
      '@media (prefers-reduced-motion:reduce){.dsh-codex-slider-thumb,.dsh-codex-slider-fill,.dsh-codex-slider-dots.is-blue{transition:none!important}}',
      'button[data-turn-process]:has([class*="_durationNumber"]){font-weight:400!important;color:#999!important;background:transparent!important;padding-left:0!important;gap:5px!important}',
      'button[data-turn-process] > [class*="_label"]:has([class*="_durationNumber"]){font-size:0!important;font-weight:400!important}',
      'button[data-turn-process] > [class*="_label"]:has([class*="_durationNumber"])::before{content:"Worked for ";font-size:13px}',
      'button[data-turn-process] > [class*="_label"]:has([class*="_durationNumber"]) span{font-size:13px!important;font-weight:400!important}',
      'button[data-turn-process] svg[class*="_chevron"]{transform:rotate(-90deg)!important;transition:transform 220ms cubic-bezier(.22,1,.36,1)!important}',
      'button[data-turn-process][aria-expanded="true"] svg[class*="_chevron"]{transform:rotate(0deg)!important}',
      '@media (prefers-reduced-motion:reduce){button[data-turn-process] svg[class*="_chevron"]{transition:none!important}}',
      '@media (prefers-reduced-motion:reduce){.dsh-codex-picker[role]{animation:none;transition:none}.dsh-codex-picker-pane{transition:none}}',
      '@media (prefers-reduced-motion: reduce){button,[role="menuitem"],[role="treeitem"],[role="button"],[role="option"],[role="tab"],[role="switch"],a,[class*="sessionRow"],[class*="projectRow"],[class*="iconButton"]{transition:none}}',
      '@media (prefers-reduced-motion: reduce){[role="menu"],[role="listbox"],[role="dialog"]{animation:none}}',

      '[data-composer-card] [class*="add"]{background:transparent !important;border:none !important;border-radius:999px !important;width:26px !important;height:26px !important;padding:0 !important;display:inline-flex !important;align-items:center !important;justify-content:center !important;transition:background-color var(--dsh-motion-base) var(--dsh-motion-ease) !important}',
      
      '[data-composer-card] [class*="add"]:hover{background:var(--dsw-alias-interactive-bg-hover) !important}',
      
      '[data-composer-card] [class*="add"] svg{stroke-width:2 !important}',
      '[data-composer-card] [class*="tools"]{gap:4px !important}',

      '[data-slot="conversation.input.permission"] button::before,[data-slot="conversation.input.permission"] button::after{display:none !important;content:none !important}',
      '[data-slot="conversation.input.permission"] button{background:transparent !important;background-image:none !important;box-shadow:none !important;height:28px !important;min-height:28px !important;max-height:28px !important;padding:0 5px !important;gap:2px !important;min-width:0 !important;width:auto !important;max-width:max-content !important;border:0 !important;border-radius:9999px !important;corner-shape:round !important;overflow:hidden !important;line-height:20px !important;font-size:13px !important;font-weight:400 !important;letter-spacing:0 !important;display:inline-flex !important;align-items:center !important;transition:none !important}',
      
      '[data-slot="conversation.input.permission"] button:hover,[data-slot="conversation.input.permission"] button[aria-expanded="true"]{background:rgba(255, 255, 255, 0.08) !important}',
      
      '[data-slot="conversation.input.permission"] button svg{width:15px !important;height:15px !important}',
      '[data-slot="conversation.input.permission"] button,[data-slot="conversation.input.permission"] button *{font-size:13px !important;font-weight:400 !important;letter-spacing:0 !important}',

      '[data-slot="conversation.input.permission"] span{background:transparent !important;background-image:none !important;box-shadow:none !important}',
      '[data-slot="conversation.input.permission"] button *{border-radius:inherit !important}',
      
      '[data-slot="conversation.input.permission"] [class*="chevron"]{display:none !important}',

      'button[aria-label*="current: Full access"],button[aria-label*="current: Full access"] *{color:var(--dsw-alias-state-warn-primary) !important;color:color-mix(in oklab, var(--dsw-alias-state-warn-primary) 62%, var(--dsw-alias-state-error-primary)) !important}',

      'button.dsh-codex-model-trigger[aria-label^="Select model"]{background:transparent !important;background-image:none !important;border-radius:9999px !important;corner-shape:round !important;transition:none !important}',
      'button.dsh-codex-model-trigger[aria-label^="Select model"]:hover,button.dsh-codex-model-trigger[aria-label^="Select model"][aria-expanded="true"]{background:rgba(255, 255, 255, 0.08) !important}',
      '[aria-label^="Send message"],[aria-label^="Stop turning"]{border-radius:999px !important}',

      '[class*="endInfo"] > span:first-child{display:none !important}',
      
      '[data-clock]{gap:2px !important}',
      '[data-clock] [class*="endInfo"]{gap:4px !important}',

      'body{font-synthesis-weight:none !important;font-synthesis-style:none !important}',

      '[class*="centerCol"]{border-radius:0 !important;box-shadow:inset 1px 0 0 0 var(--dsw-alias-border-l1) !important}',
      
      '[class*="markdown"] p,[class*="markdown"] li{font-weight:400 !important}',
      'button,[role="menuitem"],[role="menuitemradio"],[role="treeitem"],[role="button"],[role="option"],[role="tab"],[role="switch"],[role="radio"],a,[class*="iconButton"],[class*="trigger"]{cursor:default !important}',
      
      '[aria-label="Account menu"] [class*="label"]{display:none !important}',
      
      '[data-row-key="workspace:"] [class*="title"]{font-size:0 !important}',
      '[data-row-key="workspace:"] [class*="title"]::after{content:"Chats";font-size:var(--dsh-content-font-size, 13px);line-height:1.4}',

      '[class*="projectRow"],[class*="sessionRow"]{font-size:var(--dsh-content-font-size, 13px) !important;height:auto !important;min-height:2.15em;padding-block:0.12em;cursor:default !important}',
      '[class*="projectRow"] [class*="title"],[class*="sessionRow"] [class*="title"]{font-size:inherit !important;line-height:1.35 !important}',

      '[class*="projectRow"] svg,[class*="sessionRow"] svg{width:1.25em;height:1.25em}',
      '[aria-label="Automation tasks"],[aria-label="More actions"]{display:none !important}',

      '[role="menu"],[role="listbox"]{backdrop-filter:blur(6px)}',

    ].join('\n')

    const DOCK_SUPPRESS_TEXT = '[data-composer-dock] > span:last-child{display:none !important}'

    // manage a fading popup
    function useFade() {
      const [mounted, setMounted] = useState(false)
      const [shown, setShown] = useState(false)
      const timers = useRef([])
      const clear = useCallback(() => {
        timers.current.forEach(clearTimeout)
        timers.current = []
      }, [])
      useEffect(() => clear, [clear])
      const open = useCallback(() => {
        clear()
        setMounted(true)
        
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { setShown(true) })
        })
      }, [clear])
      const close = useCallback(() => {
        clear()
        setShown(false)
        timers.current.push(setTimeout(() => { setMounted(false) }, FADE_MS + 60))
      }, [clear])
      return { mounted, shown, open, close }
    }

    // build popup styling
    function menuLook() {
      return {
        position: 'fixed',
        background: 'var(--dsw-specific-menu, var(--dsw-alias-bg-layer-1))',
        backdropFilter: 'var(--dsw-menu-backdrop-filter)',
        '--dsw-elevation-stroke-color': 'var(--dsw-alias-border-l1)',
        boxShadow: 'var(--dsw-elevation-prominent, 0 8px 24px rgba(0, 0, 0, 0.32))',
        color: 'var(--dsw-alias-label-secondary)',
        zIndex: 60,
      }
    }

    // place a popup above its trigger
    function aboveChip(rect) {
      const viewportWidth = window.innerWidth || 0
      const viewportHeight = window.innerHeight || 0
      return {
        right: Math.max(8, viewportWidth - (rect === null ? viewportWidth - 8 : rect.right)),
        top: Math.max(8, (rect === null ? 0 : rect.bottom) + 8),
      }
    }

    // render a colored dot
    function dot(color) {
      return h('span', {
        style: {
          width: 8, height: 8, borderRadius: 2,
          background: color, display: 'inline-block', flex: 'none',
        },
      })
    }

    // show context usage details
    function ContextChip(props) {
      const useProjection = props.useProjection
      const readable = typeof useProjection === 'function'
      const pressure = readable ? useProjection('contextPressure') : undefined
      const breakdown = readable ? useProjection('contextBreakdown') : undefined
      const data = occupancy(pressure)
      const panelFade = useFade()
      const legendFade = useFade()
      const [rect, setRect] = useState(null)
      const [legendBox, setLegendBox] = useState(null)
      const rootRef = useRef(null)
      const panelRef = useRef(null)
      const chipTimer = useRef(null)
      const barTimer = useRef(null)
      const leaveTimer = useRef(null)

      const clearChipTimer = () => {
        if (chipTimer.current !== null) { clearTimeout(chipTimer.current); chipTimer.current = null }
      }
      const clearBarTimer = () => {
        if (barTimer.current !== null) { clearTimeout(barTimer.current); barTimer.current = null }
      }
      const clearLeaveTimer = () => {
        if (leaveTimer.current !== null) { clearTimeout(leaveTimer.current); leaveTimer.current = null }
      }

      useEffect(() => () => {
        clearChipTimer()
        clearBarTimer()
        clearLeaveTimer()
      }, [])

      const dismiss = useCallback(() => {
        clearChipTimer()
        clearBarTimer()
        clearLeaveTimer()
        setLegendBox(null)
        legendFade.close()
        panelFade.close()
      }, [legendFade, panelFade])

      const openPanel = () => {
        const element = rootRef.current
        if (element !== null) setRect(element.getBoundingClientRect())
        panelFade.open()
      }

      const scheduleDismiss = () => {
        clearLeaveTimer()
        leaveTimer.current = setTimeout(() => { dismiss() }, DISMISS_MS)
      }

      const cancelDismiss = () => { clearLeaveTimer() }

      useEffect(() => {
        if (!panelFade.mounted) return undefined
        const onDown = (e) => {
          const chip = rootRef.current
          if (chip !== null && chip.contains(e.target)) return
          if (panelRef.current !== null && panelRef.current.contains(e.target)) return
          dismiss()
        }
        const onKey = (e) => { if (e.key === 'Escape') dismiss() }
        document.addEventListener('pointerdown', onDown, true)
        document.addEventListener('keydown', onKey)
        return () => {
          document.removeEventListener('pointerdown', onDown, true)
          document.removeEventListener('keydown', onKey)
        }
      }, [panelFade.mounted, dismiss])

      useEffect(() => {
        if (!panelFade.mounted) return undefined
        window.addEventListener('scroll', dismiss, true)
        window.addEventListener('blur', dismiss)
        return () => {
          window.removeEventListener('scroll', dismiss, true)
          window.removeEventListener('blur', dismiss)
        }
      }, [panelFade.mounted, dismiss])

      if (data === null) return null

      const percent = data.percent
      const reading = `${percent}%`
      const label = `${reading} of context used. Rest to see the occupancy panel.`
      const total = breakdown === undefined
        ? 0
        : breakdown.systemTokens + breakdown.toolsTokens + breakdown.messageTokens
      const segments = breakdown === undefined || total === 0
        ? [{ key: 'total', color: 'var(--dsw-alias-label-tertiary)', width: percent }]
        : ROWS.map(row => ({
          key: row.key,
          color: row.color,
          width: percent * breakdown[row.key] / total,
        })).filter(segment => segment.width > 0)

      const startBarDwell = () => {
        clearBarTimer()
        barTimer.current = setTimeout(() => {
          const element = panelRef.current
          if (element !== null) {
            const box = element.getBoundingClientRect()
            const viewportWidth = window.innerWidth || 0
            const viewportHeight = window.innerHeight || 0
            setLegendBox({
              right: Math.max(8, viewportWidth - box.right),
              top: box.bottom + 6,
            })
          }
          legendFade.open()
        }, BAR_DWELL_MS)
      }

      const panelSurface = !panelFade.mounted ? null : h('div', {
        key: 'panel',
        role: 'tooltip',
        'aria-label': 'Context usage',
        ref: panelRef,
        className: 'dsh-uideclutter-surface',
        'data-shown': panelFade.shown ? 'true' : 'false',
        onPointerEnter: cancelDismiss,
        onPointerLeave: scheduleDismiss,
        style: {
          ...menuLook(),
          ...aboveChip(rect),
          minWidth: 208,
          padding: 12,
          borderRadius: 'var(--dsw-radius-lg, 12px)',
          fontSize: 12,
          lineHeight: '20px',
        },
      }, [
        h('div', {
          key: 'head',
          style: { display: 'flex', alignItems: 'center', gap: 6 },
        }, [
          h('span', { key: 'p', style: { fontWeight: 500, color: 'var(--dsw-alias-label-primary)' } }, reading),
          h('span', {
            key: 'n',
            style: {
              marginLeft: 'auto',
              fontWeight: 500,
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--dsw-alias-label-primary)',
            },
          }, `~${fmt(data.usedTokens)} / ${fmt(data.contextWindow)}`),
        ]),
        h('div', {
          key: 'barhit',
          className: 'dsh-uideclutter-bar',
          tabIndex: 0,
          'aria-label': 'Rest here for the context breakdown',
          onPointerEnter: startBarDwell,
          onPointerLeave: () => { clearBarTimer(); legendFade.close() },
          onFocus: startBarDwell,
          onBlur: () => { clearBarTimer(); legendFade.close() },
          style: { padding: '5px 0', cursor: 'default' },
        }, h('div', {
          key: 'bar',
          style: {
            display: 'flex',
            gap: 1,
            height: 4,
            borderRadius: 999,
            overflow: 'hidden',
            background: 'var(--dsw-alias-interactive-bg-hover)',
          },
        }, segments.map(segment => h('div', {
          key: segment.key,
          style: {
            width: `${segment.width}%`,
            minWidth: 2,
            borderRadius: 1,
            background: segment.color,
          },
        })))),
      ])

      const legendSurface = !legendFade.mounted || legendBox === null ? null : h('div', {
        key: 'legend',
        role: 'tooltip',
        className: 'dsh-uideclutter-surface',
        'data-shown': legendFade.shown ? 'true' : 'false',
        style: {
          ...menuLook(),
          right: legendBox.right,
          top: legendBox.top,
          minWidth: 136,
          padding: '8px 10px',
          borderRadius: 'var(--dsw-radius-md, 8px)',
          fontSize: 12,
          lineHeight: '18px',
          display: 'grid',
          gap: 2,
          zIndex: 61,
          pointerEvents: 'none',
        },
      }, ROWS.map(row => h('div', {
        key: row.key,
        style: { display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' },
      }, [
        h('span', {
          key: 'l',
          style: { display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--dsw-alias-label-secondary)' },
        }, [dot(row.color), row.label]),
        h('span', {
          key: 'v',
          style: { fontVariantNumeric: 'tabular-nums', color: 'var(--dsw-alias-label-primary)' },
        }, breakdown === undefined ? '—' : `~${fmt(breakdown[row.key])}`),
      ])))

      return h('span', {
        ref: rootRef,
        style: { position: 'relative', display: 'inline-flex', alignItems: 'center' },
      }, [
        h('style', { key: 'styles' }, STYLE_TEXT),
        h('style', { key: 'dock' }, DOCK_SUPPRESS_TEXT),
        h('span', {
          key: 'chip',
          tabIndex: 0,
          className: 'dsh-uideclutter-chip',
          'aria-label': label,
          onPointerEnter: () => {
            cancelDismiss()
            clearChipTimer()
            chipTimer.current = setTimeout(() => { openPanel() }, CHIP_DWELL_MS)
          },
          onPointerLeave: () => {
            clearChipTimer()
            scheduleDismiss()
          },
          onFocus: () => {
            cancelDismiss()
            openPanel()
          },
          onBlur: () => { scheduleDismiss() },
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '1px 8px',
            borderRadius: 'var(--dsw-radius-sm, 4px)',
            cursor: 'default',
            font: 'inherit',
            fontSize: 'var(--dsh-content-font-size-secondary, 13px)',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: '20px',
            whiteSpace: 'nowrap',
          },
        }, [
          h('svg', { key: 'ring', viewBox: '0 0 14 14', width: 14, height: 14, 'aria-hidden': true }, [
            h('circle', {
              key: 'track',
              cx: 7, cy: 7, r: RADIUS, fill: 'none',
              stroke: 'var(--dsw-alias-border-l3)', strokeWidth: 2,
            }),
            h('circle', {
              key: 'fill',
              className: 'dsh-uideclutter-ring-fill',
              cx: 7, cy: 7, r: RADIUS, fill: 'none',
              stroke: 'var(--dsw-alias-label-tertiary)',
              strokeWidth: 2,
              strokeLinecap: 'round',
              strokeDasharray: `${CIRCUMFERENCE * percent / 100} ${CIRCUMFERENCE}`,
              transform: 'rotate(-90 7 7)',
            }),
          ]),
          h('span', { key: 'text' }, reading),
        ]),
        panelSurface === null
          ? null
          : (createPortal !== null ? createPortal(panelSurface, document.body) : panelSurface),
        legendSurface === null
          ? null
          : (createPortal !== null ? createPortal(legendSurface, document.body) : legendSurface),
      ])
    }

    // render an empty slot
    function Nothing() {
      return null
    }

    // find workspaces in a host response
    function pickWorkspaceArray(frame) {
      if (frame === null || typeof frame !== 'object') return []
      const values = Array.isArray(frame) ? [frame] : Object.values(frame)
      for (const value of values) {
        if (!Array.isArray(value) || value.length === 0) continue
        const first = value[0]
        if (first === null || typeof first !== 'object' || typeof first.id !== 'string') continue
        return value.filter(item => item !== null && typeof item === 'object' && typeof item.id === 'string')
      }
      return []
    }

    // get a workspace label
    function workspaceTitle(workspace) {
      if (typeof workspace.displayTitle === 'string' && workspace.displayTitle !== '') return workspace.displayTitle
      if (typeof workspace.title === 'string' && workspace.title !== '') return workspace.title
      if (typeof workspace.path === 'string' && workspace.path !== '') return workspace.path
      return String(workspace.id)
    }

    // load available workspaces
    async function loadWorkspaceList(services) {
      const fromHost = await loadWorkspaceListFromHost(services)
      if (fromHost.length > 0) return fromHost
      return loadWorkspaceIdsFromRows()
    }

    // read workspaces from the host
    async function loadWorkspaceListFromHost(services) {
      const controller = new AbortController()
      const timer = setTimeout(() => { controller.abort() }, 4000)
      try {
        const remote = services === undefined ? undefined : services.remote
        const namespace = remote === undefined ? undefined : remote.workspace
        if (namespace === undefined) return []
        if (typeof namespace.follow === 'function') {
          for await (const frame of namespace.follow(controller.signal)) {
            const workspaces = pickWorkspaceArray(frame)
            if (workspaces.length > 0) return workspaces
          }
          return []
        }
        if (typeof namespace.list === 'function') {
          return pickWorkspaceArray(await namespace.list())
        }
      } catch {
        return []
      } finally {
        clearTimeout(timer)
        controller.abort()
      }
      return []
    }

    // read visible workspace ids
    function loadWorkspaceIdsFromRows() {
      const rows = Array.from(document.querySelectorAll('[data-row-key]'))
      const found = new Map()
      for (const row of rows) {
        const key = row.getAttribute('data-row-key')
        if (key === null || !key.startsWith('workspace:')) continue
        const id = key.slice('workspace:'.length)
        if (id === '' || found.has(id)) continue
        const text = (row.textContent === null ? '' : row.textContent).trim()
        found.set(id, { id, displayTitle: text.split('\n')[0].slice(0, 60) })
      }
      return Array.from(found.values())
    }

    // render the move action
    function MoveToWorkspaceItem(props) {
      const { sessionId, useMenuOpenState, services } = props
      const [, setMenuOpen] = useMenuOpenState()
      const [chooser, setChooser] = useState(false)
      const [workspaces, setWorkspaces] = useState(null)
      const [failure, setFailure] = useState(null)

      useEffect(() => {
        if (!chooser) return undefined
        const onKey = (e) => { if (e.key === 'Escape') setChooser(false) }
        document.addEventListener('keydown', onKey)
        return () => { document.removeEventListener('keydown', onKey) }
      }, [chooser])

      const open = () => {
        setMenuOpen(false)
        setChooser(true)
        if (workspaces !== null) return
        loadWorkspaceList(services)
          .then((list) => { setWorkspaces(list) })
          .catch(() => { setFailure('Could not read the workspace list.') })
      }

      const move = (workspaceId) => {
        const workspacesService = services === undefined ? undefined : services.workspaces
        if (workspacesService === undefined || typeof workspacesService.insertSessionBefore !== 'function') {
          setFailure('Moving sessions is unavailable in this profile.')
          return
        }
        setChooser(false)
        Promise.resolve(workspacesService.insertSessionBefore(workspaceId, sessionId))
          .catch(() => { setFailure('The Host refused the move.') })
      }

      const entry = h('button', {
        key: 'entry',
        type: 'button',
        role: 'menuitem',
        className: 'dsh-uideclutter-menuitem',
        onClick: open,
        style: {
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          height: 32,
          padding: '0 10px',
          border: 'none',
          background: 'transparent',
          color: 'var(--dsw-alias-label-primary)',
          font: 'inherit',
          fontSize: 13,
          textAlign: 'left',
          cursor: 'pointer',
          borderRadius: 'var(--dsw-radius-sm, 4px)',
        },
      }, 'Move to workspace…')

      if (!chooser) {
        return failure === null
          ? entry
          : [entry, h('div', {
            key: 'failure',
            style: { padding: '0 10px 6px', fontSize: 12, color: 'var(--dsw-alias-state-error-primary)' },
          }, failure)]
      }

      const body = workspaces === null
        ? h('div', { key: 'loading', style: { padding: '10px 12px', fontSize: 12 } }, 'Reading workspaces…')
        : (workspaces.length === 0
          ? h('div', { key: 'empty', style: { padding: '10px 12px', fontSize: 12 } }, 'No registered workspaces.')
          : workspaces.map(workspace => h('button', {
            key: String(workspace.id),
            type: 'button',
            onClick: () => { move(workspace.id) },
            style: {
              display: 'block',
              width: '100%',
              padding: '7px 10px',
              border: 'none',
              borderRadius: 'var(--dsw-radius-sm, 4px)',
              background: 'transparent',
              color: 'var(--dsw-alias-label-primary)',
              font: 'inherit',
              fontSize: 13,
              textAlign: 'left',
              cursor: 'pointer',
            },
          }, workspaceTitle(workspace))))

      const dialog = h('div', {
        key: 'overlay',
        onPointerDown: (e) => { if (e.target === e.currentTarget) setChooser(false) },
        style: {
          position: 'fixed',
          inset: 0,
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.35)',
        },
      }, h('div', {
        role: 'dialog',
        'aria-label': 'Move session to workspace',
        style: {
          ...menuLook(),
          position: 'relative',
          right: 'auto',
          bottom: 'auto',
          width: 280,
          maxHeight: '60vh',
          overflowY: 'auto',
          padding: 8,
          borderRadius: 'var(--dsw-radius-lg, 12px)',
          fontSize: 13,
        },
      }, [
        h('div', {
          key: 'head',
          style: {
            padding: '4px 10px 8px',
            fontSize: 12,
            color: 'var(--dsw-alias-label-tertiary)',
          },
        }, 'Move this session to'),
        body,
      ]))

      return [entry, createPortal !== null ? createPortal(dialog, document.body) : dialog]
    }

    // render the new chat action
    function NewChatButton({ onStart }) {
      return h('button', {
        type: 'button',
        className: 'dsh-uideclutter-newchat',
        title: 'New chat (no workspace)',
        'aria-label': 'New chat (no workspace)',
        onClick: onStart,
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          padding: 0,
          border: 'none',
          borderRadius: 'var(--dsw-radius-sm, 4px)',
          background: 'transparent',
          cursor: 'pointer',
        },
      }, h('svg', {
        viewBox: '0 0 16 16',
        width: 15,
        height: 15,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1,
        'aria-hidden': true,
      }, h('path', {
        d: 'M13.5 9.5A1.5 1.5 0 0 1 12 11H5.5L2.5 13.5V4A1.5 1.5 0 0 1 4 2.5h8A1.5 1.5 0 0 1 13.5 4v5.5Z',
      })))
    }

    const moveBridge = { open: null }

    // connect the move action
    function MoveToWorkspaceEntry(props) {
      const { sessionId, useMenuOpenState, services } = props
      const menuOpenState = typeof useMenuOpenState === 'function' ? useMenuOpenState() : undefined
      const setMenuOpen = Array.isArray(menuOpenState) ? menuOpenState[1] : undefined
      const [problem, setProblem] = useState(null)
      const entry = h('button', {
        type: 'button',
        role: 'menuitem',
        className: 'dsh-uideclutter-menuitem',
        onClick: () => {
          if (moveBridge.open === null) {
            setProblem('chooser host missing')
            return
          }
          if (typeof setMenuOpen === 'function') setMenuOpen(false)
          moveBridge.open(sessionId, services)
        },
      }, [
        h('span', {
          key: 'icon',
          className: 'dsh-uideclutter-menuicon',
        }, h('svg', {
          viewBox: '0 0 16 16',
          width: 16,
          height: 16,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1,
          'aria-hidden': true,
        }, [
          h('path', {
            key: 'folder',
            d: 'M2 4.5A1.5 1.5 0 0 1 3.5 3h2.4l1.3 1.5h4.3A1.5 1.5 0 0 1 13 6v5.5A1.5 1.5 0 0 1 11.5 13h-8A1.5 1.5 0 0 1 2 11.5v-7Z',
          }),
          h('path', { key: 'arrow', d: 'M6.4 8.6h3.1M8.3 7.3l1.3 1.3-1.3 1.3' }),
        ])),
        h('span', { key: 'label', style: { flex: '1', textAlign: 'left' } }, 'Move to workspace…'),
      ])
      if (problem === null) return entry
      return [entry, h('div', {
        key: 'problem',
        style: { padding: '0 10px 6px', fontSize: 12, color: 'var(--dsw-alias-state-error-primary)' },
      }, problem)]
    }

    // render the workspace chooser
    function MoveChooserHost(props) {
      const { services } = props
      const [request, setRequest] = useState(null)
      const [workspaces, setWorkspaces] = useState(null)
      const [failure, setFailure] = useState(null)

      useEffect(() => {
        moveBridge.open = (sessionId, entryServices) => {
          const target = entryServices === undefined ? services : entryServices
          setRequest({ sessionId, services: target })
          setWorkspaces(null)
          setFailure(null)
          loadWorkspaceList(target)
            .then((list) => { setWorkspaces(list) })
            .catch(() => { setFailure('Could not read the workspace list.') })
        }
        return () => { moveBridge.open = null }
      }, [services])

      useEffect(() => {
        if (request === null) return undefined
        const onKey = (e) => { if (e.key === 'Escape') setRequest(null) }
        document.addEventListener('keydown', onKey)
        return () => { document.removeEventListener('keydown', onKey) }
      }, [request])

      if (request === null) return null

      const move = (workspaceId) => {
        const target = request.services === undefined ? undefined : request.services.workspaces
        if (target === undefined || typeof target.insertSessionBefore !== 'function') {
          setFailure('Moving sessions is unavailable in this profile.')
          return
        }
        setFailure(null)
        Promise.resolve(target.insertSessionBefore(workspaceId, request.sessionId))
          .then(() => { setRequest(null) })
          .catch((error) => {
            const message = error === null || error === undefined
              ? 'unknown error'
              : (typeof error.message === 'string' ? error.message : String(error))
            setFailure(`Move failed: ${message}`)
          })
      }

      const body = failure !== null
        ? null
        : (workspaces === null
          ? h('div', { key: 'wait', className: 'dsh-uideclutter-dialogrow' }, 'Reading workspaces…')
          : (workspaces.length === 0
            ? h('div', { key: 'none', className: 'dsh-uideclutter-dialogrow' }, 'No registered workspaces found.')
            : workspaces.map(workspace => h('button', {
              key: String(workspace.id),
              type: 'button',
              className: 'dsh-uideclutter-menuitem',
              onClick: () => { move(workspace.id) },
            }, workspaceTitle(workspace)))))

      const dialog = h('div', {
        key: 'overlay',
        onPointerDown: (e) => { if (e.target === e.currentTarget) setRequest(null) },
        style: {
          position: 'fixed',
          inset: 0,
          zIndex: 1300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.32)',
        },
      }, h('div', {
        role: 'dialog',
        'aria-label': 'Move session to workspace',
        style: {
          ...menuLook(),
          position: 'relative',
          right: 'auto',
          bottom: 'auto',
          width: 280,
          maxHeight: '60vh',
          overflowY: 'auto',
          display: 'grid',
          gap: 2,
          padding: 8,
          borderRadius: 'var(--dsw-radius-lg, 12px)',
          fontSize: 13,
          lineHeight: '20px',
        },
      }, [
        h('div', {
          key: 'head',
          style: { padding: '4px 10px 8px', fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' },
        }, failure === null ? 'Move this session to' : failure),
        body,
      ]))

      return createPortal !== null ? createPortal(dialog, document.body) : dialog
    }

    // render the model and effort picker
    function CodexModelSelect({ locked, available, directory, load, select }) {
      const state = useSyncExternalStore(fn => directory.subscribe(fn), () => directory.getSnapshot(), () => directory.getSnapshot())
      const [open, setOpen] = useState(false)
      const [pane, setPane] = useState('effort')
      const [error, setError] = useState('')
      const [position, setPosition] = useState({ left: 8, bottom: 8 })
      const [pickerHeight, setPickerHeight] = useState(92)
      const [sliderPosition, setSliderPosition] = useState(null)
      const [dragging, setDragging] = useState(false)
      const draggingRef = useRef(false)
      const startX = useRef(0)
      const [hoverIndex, setHoverIndex] = useState(null)
      const spring = useRef({ frame: 0, position: 0, target: 0, velocity: 0, time: 0 })
      useEffect(() => () => cancelAnimationFrame(spring.current.frame), [])
      const trigger = useRef(null)
      const menu = useRef(null)
      const effortPane = useRef(null)
      const modelPane = useRef(null)
      useEffect(() => { if (available) load() }, [available, load])
      useEffect(() => {
        if (!open) return
        const close = event => {
          if (!trigger.current?.contains(event.target) && !menu.current?.contains(event.target)) setOpen(false)
        }
        document.addEventListener('pointerdown', close, true)
        return () => document.removeEventListener('pointerdown', close, true)
      }, [open])
      useEffect(() => {
        if (!open) return
        const frame = requestAnimationFrame(() => { const active = pane === 'effort' ? effortPane.current : modelPane.current; (active?.querySelector('[role="slider"]') ?? active?.querySelector('[aria-checked="true"]:not(:disabled)') ?? active?.querySelector('button:not(:disabled)'))?.focus() })
        return () => cancelAnimationFrame(frame)
      }, [open, pane])
      useLayoutEffect(() => {
        if (!open) return
        const active = pane === 'effort' ? effortPane.current : modelPane.current
        if (!active) return
        const measure = () => setPickerHeight(Math.min(active.scrollHeight, 420, Math.max(80, window.innerHeight - position.bottom - 8)))
        measure()
        window.addEventListener('resize', measure)
        return () => window.removeEventListener('resize', measure)
      }, [open, pane, state.groups, position.bottom])
      const current = state.current
      const group = state.groups.find(item => item.id === current?.provider)
      const model = group?.models.find(item => item.id === current?.model)
      const reasoning = model?.reasoning
      const effort = current?.reasoningEffort ?? reasoning?.defaultEffort
      const effortName = reasoning?.efforts.find(item => item.id === effort)?.name ?? state.retainedEffort ?? effort
      const show = () => {
        if (open) { setOpen(false); return }
        const rect = trigger.current.getBoundingClientRect()
        setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - 314)), bottom: window.innerHeight - rect.top + 6 })
        setPickerHeight(92)
        setPane('effort')
        setError('')
        load()
        setOpen(true)
      }
      const choose = async (choice, keepOpen = false) => {
        setError('')
        try {
          const result = await select(choice)
          if (!result?.ok) throw new Error(result?.error?.message ?? 'Selection failed')
          if (!keepOpen) { setOpen(false); trigger.current?.focus() }
          return true
        } catch (failure) { setError(failure?.message ?? 'Selection failed'); return false }
      }
      const onMenuKey = event => {
        if (event.key === 'Escape') { event.preventDefault(); if (pane === 'model') setPane('effort'); else { setOpen(false); trigger.current?.focus() } }
        if (event.target?.getAttribute('role') === 'slider' || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return
        event.preventDefault()
        const items = [...(pane === 'effort' ? effortPane.current : modelPane.current).querySelectorAll('button:not(:disabled)')]
        if (!items.length) return
        const index = items.indexOf(document.activeElement)
        items[index < 0 ? (event.key === 'ArrowDown' ? 0 : items.length - 1) : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus()
      }
      const efforts = reasoning?.efforts ?? []
      const effortIndex = Math.max(0, efforts.findIndex(item => item.id === effort))
      const progress = efforts.length > 1 ? effortIndex / (efforts.length - 1) * 100 : 0
      const previewIndex = sliderPosition === null ? effortIndex : Math.round(sliderPosition * (efforts.length - 1))
      const previewName = efforts[previewIndex]?.name ?? effortName
      const chevron = direction => h('svg', { className: 'dsh-codex-chevron', width: 12, height: 12, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }, h('path', { d: direction === 'down' ? 'm4.5 6 3.5 3.5L11.5 6' : 'm6 4.5 3.5 3.5L6 11.5' }))
      const setEffort = item => { if (item && current && item.id !== effort) void choose({ provider: current.provider, model: current.model, reasoningEffort: item.id }, true) }
      const pointerFraction = event => { const rect = event.currentTarget.getBoundingClientRect(); const inset = 13.5; return Math.max(0, Math.min(1, (event.clientX - rect.left - inset) / Math.max(1, rect.width - inset * 2))) }
      const followPointer = fraction => {
        const s = spring.current
        s.target = fraction
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { s.position = fraction; setSliderPosition(fraction); return }
        if (s.frame) return
        s.time = 0
        const tick = time => {
          const dt = s.time ? Math.min((time - s.time) / 1000, .05) : 1 / 60
          s.time = time
          const omega = 85
          const offset = s.position - s.target
          const decay = Math.exp(-omega * dt)
          const term = s.velocity + omega * offset
          s.position = Math.max(0, Math.min(1, s.target + (offset + term * dt) * decay))
          s.velocity = (s.velocity - omega * term * dt) * decay
          setSliderPosition(s.position)
          if (Math.abs(s.target - s.position) < .0001 && Math.abs(s.velocity) < .01) { s.frame = 0; s.position = s.target; setSliderPosition(s.target); return }
          s.frame = requestAnimationFrame(tick)
        }
        s.frame = requestAnimationFrame(tick)
      }
      const finishDrag = (event, cancel = false) => {
        if (!draggingRef.current) return
        draggingRef.current = false
        cancelAnimationFrame(spring.current.frame)
        spring.current.frame = 0
        setDragging(false)
        const index = cancel ? effortIndex : Math.round(pointerFraction(event) * (efforts.length - 1))
        setSliderPosition(efforts.length > 1 ? index / (efforts.length - 1) : 0)
        if (!cancel && efforts[index] && current && efforts[index].id !== effort) {
          void choose({ provider: current.provider, model: current.model, reasoningEffort: efforts[index].id }, true).finally(() => setSliderPosition(null))
        } else setSliderPosition(null)
      }
      const effortRows = [h('div', { key: 'heading', className: 'dsh-codex-effort-heading' }, [
            h('button', { key: 'center', type: 'button', className: 'dsh-codex-effort-select', onClick: () => setPane('model'), 'aria-label': `Select model, current ${model?.name ?? current?.model ?? 'unknown'}` }, [h('span', { key: 'title', className: 'dsh-codex-effort-title', style: { display: 'block' } }, previewName ?? 'Reasoning'), h('span', { key: 'model', className: 'dsh-codex-effort-model' }, [model?.name ?? current?.model ?? 'Choose model', chevron('right')])])]),
          efforts.length ? h('div', { key: 'slider', className: `dsh-codex-slider-wrap${dragging ? '' : ' is-settling'}`, style: { '--slider-pos': sliderPosition ?? progress / 100, background: '#3f3f3f' }, role: 'slider', tabIndex: 0, 'aria-label': 'Reasoning effort', 'aria-valuemin': 0, 'aria-valuemax': efforts.length - 1, 'aria-valuenow': sliderPosition === null ? effortIndex : Math.round(sliderPosition * (efforts.length - 1)), 'aria-valuetext': efforts[sliderPosition === null ? effortIndex : Math.round(sliderPosition * (efforts.length - 1))]?.name ?? effortName, 'aria-disabled': state.pending !== null || efforts.length < 2,
            onPointerDown: event => { if (state.pending !== null || efforts.length < 2 || event.button !== 0) return; event.preventDefault(); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId); draggingRef.current = true; startX.current = event.clientX; spring.current.position = sliderPosition ?? progress / 100; spring.current.velocity = 0; setHoverIndex(Math.round(pointerFraction(event) * (efforts.length - 1))) },
            onPointerMove: event => { const fraction = pointerFraction(event); setHoverIndex(Math.round(fraction * (efforts.length - 1))); if (draggingRef.current && (dragging || Math.abs(event.clientX - startX.current) >= 3)) { setDragging(true); followPointer(fraction) } },
            onPointerLeave: () => { if (!draggingRef.current) setHoverIndex(null) },
            onPointerUp: event => finishDrag(event), onPointerCancel: event => finishDrag(event, true),
            onKeyDown: event => { const delta = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : 0; if (delta || event.key === 'Home' || event.key === 'End') { event.preventDefault(); event.stopPropagation(); if (state.pending !== null) return; setEffort(efforts[event.key === 'Home' ? 0 : event.key === 'End' ? efforts.length - 1 : Math.max(0, Math.min(efforts.length - 1, effortIndex + delta))]) } },
          }, [h('div', { key: 'fill', className: 'dsh-codex-slider-fill' }), ...['base', 'blue'].map(layer => h('div', { key: layer, className: `dsh-codex-slider-dots${layer === 'blue' ? ' is-blue' : ''}`, 'aria-hidden': true }, efforts.map((item, index) => h('i', { key: item.id, className: index === (hoverIndex ?? previewIndex) ? 'selected' : '' })))), h('div', { key: 'thumb', className: 'dsh-codex-slider-thumb', 'aria-hidden': true })]) : h('div', { key: 'empty', className: 'dsh-codex-menu-label' }, 'No effort levels available')]
      const modelRows = [h('div', { key: 'header', className: 'dsh-codex-menu-label' }, 'Select model'),
          ...state.groups.flatMap(provider => [h('div', { className: 'dsh-codex-menu-label', key: `g:${provider.id}` }, provider.name ?? provider.id),
            ...provider.models.map(item => h('button', { key: `${provider.id}:${item.id}`, type: 'button', role: 'menuitemradio', 'aria-checked': provider.id === current?.provider && item.id === current?.model, className: 'dsh-codex-menu-row', disabled: state.pending !== null,
              onClick: async () => { if (provider.id === current?.provider && item.id === current?.model) { setPane('effort'); return } const ok = await choose({ provider: provider.id, model: item.id, ...(item.reasoning?.defaultEffort === undefined ? {} : { reasoningEffort: item.reasoning.defaultEffort }) }, true); if (ok) { setSliderPosition(null); setHoverIndex(null); setPane('effort') } } }, [h('span', { key: 'label' }, item.name), provider.id === current?.provider && item.id === current?.model ? h('span', { key: 'check', 'aria-hidden': true }, '✓') : null]))])]
      if (error) (pane === 'effort' ? effortRows : modelRows).push(h('div', { key: 'error', role: 'alert', className: 'dsh-codex-menu-label' }, error))
      const popup = open && createPortal ? createPortal(h('div', { ref: menu, role: 'dialog', 'aria-label': pane === 'effort' ? 'Reasoning' : 'Select model', className: 'dsh-codex-menu dsh-codex-picker', style: { ...position, height: pickerHeight }, onKeyDown: onMenuKey }, [
        h('div', { key: 'effort', ref: effortPane, className: `dsh-codex-picker-pane dsh-codex-picker-effort${pane === 'effort' ? ' is-active' : ''}`, 'aria-hidden': pane !== 'effort', inert: pane !== 'effort' ? '' : undefined }, effortRows),
        h('div', { key: 'model', ref: modelPane, className: `dsh-codex-picker-pane dsh-codex-picker-model${pane === 'model' ? ' is-active' : ''}`, 'aria-hidden': pane !== 'model', inert: pane !== 'model' ? '' : undefined }, modelRows),
      ]), document.body) : null
      return h(React.Fragment, null, [h('button', { key: 'trigger', ref: trigger, type: 'button', className: 'dsh-codex-model-trigger', 'aria-haspopup': 'dialog', 'aria-expanded': open, 'aria-label': `Select model, current ${model?.name ?? current?.model ?? 'unknown'}${effortName ? `, reasoning effort ${effortName}` : ''}`, disabled: locked || !available || state.pending !== null, onClick: show }, open ? [h('span', { key: 'select' }, 'Select effort'), chevron('down')] : [h('span', { key: 'model' }, model?.name ?? current?.model ?? 'Model'), effortName ? h('span', { key: 'effort', className: 'dsh-codex-effort' }, effortName) : null, chevron('down')]), popup])
    }

    // render an access icon
    function permissionIcon(id) {
      const common = { width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
      if (id === 'workspace-write') return h('svg', common, [h('path', { key: 'hand', d: 'M7 11V5.5a1.5 1.5 0 0 1 3 0V10m0-5V4a1.5 1.5 0 0 1 3 0v6m0-5a1.5 1.5 0 0 1 3 0v5m0-3a1.5 1.5 0 0 1 3 0v6c0 4-2.4 7-6.5 7H12c-3 0-4.5-1.2-6-3.2L3.5 13a1.7 1.7 0 0 1 2.7-2L7 12' })])
      return h('svg', common, [h('path', { key: 'shield', d: 'M12 3.5 5.5 6v5.5c0 4 2.6 7 6.5 8.5 3.9-1.5 6.5-4.5 6.5-8.5V6L12 3.5Z' }), id === 'auto' ? h('path', { key: 'mark', d: 'm9 10 2 2-2 2m4 0h2' }) : h('path', { key: 'mark', d: 'M12 8v5m0 3h.01' })])
    }

    // render the access picker
    function CodexPermissionSelect({ locked, useProjection, loadCatalog, select }) {
      const selection = useProjection('permissions')
      const [open, setOpen] = useState(false)
      const [options, setOptions] = useState(null)
      const [error, setError] = useState('')
      const [pending, setPending] = useState(false)
      const [confirm, setConfirm] = useState(null)
      const [position, setPosition] = useState({ left: 8, bottom: 8 })
      const trigger = useRef(null)
      const menu = useRef(null)
      useEffect(() => {
        if (!open) return
        const close = event => { if (!trigger.current?.contains(event.target) && !menu.current?.contains(event.target)) setOpen(false) }
        document.addEventListener('pointerdown', close, true)
        return () => document.removeEventListener('pointerdown', close, true)
      }, [open])
      useEffect(() => {
        if (!open || options === null) return
        const frame = requestAnimationFrame(() => (menu.current?.querySelector('[aria-checked="true"]:not(:disabled)') ?? menu.current?.querySelector('button:not(:disabled)'))?.focus())
        return () => cancelAnimationFrame(frame)
      }, [open, options])
      if (selection === undefined) return null
      const names = { 'workspace-write': 'Ask for approval', 'auto': 'Approve for me', 'model-approval': 'Legacy reviewer', 'danger-full-access': 'Full access', 'read-only': 'Read only' }
      const descriptions = { 'workspace-write': 'Ask before actions that need wider permissions', 'auto': 'Experimental: DeepSeek reviews each supported tool call', 'danger-full-access': 'Unrestricted access to files and commands' }
      const current = selection.currentValue
      const show = async () => {
        if (open) { setOpen(false); return }
        const rect = trigger.current.getBoundingClientRect()
        setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - 418)), bottom: window.innerHeight - rect.top + 6 })
        setError('')
        setOptions(null)
        setOpen(true)
        try { setOptions(await loadCatalog()) } catch (failure) { setOptions([]); setError(`Could not load permission options: ${failure?.message ?? String(failure)}`) }
      }
      const submit = async id => {
        setConfirm(null)
        setPending(true)
        try { await select(id); setOpen(false) } catch (failure) { setError(failure?.message ?? 'Could not change permission mode'); setOpen(true) } finally { setPending(false) }
      }
      const choose = id => {
        if (id === current) { setOpen(false); return }
        if (id === 'danger-full-access' || id === 'auto') { setOpen(false); setConfirm(id); return }
        void submit(id)
      }
      const available = new Set((options ?? []).map(item => item.value))
      const modes = ['workspace-write', 'auto', 'danger-full-access']
      const popup = open && createPortal ? createPortal(h('div', { ref: menu, role: 'menu', 'aria-label': 'Permission mode', className: 'dsh-codex-menu dsh-codex-permission-menu', style: position,
        onKeyDown: event => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); const buttons = [...menu.current.querySelectorAll('button:not(:disabled)')]; const index = buttons.indexOf(document.activeElement); if (buttons.length) buttons[index < 0 ? (event.key === 'ArrowDown' ? 0 : buttons.length - 1) : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length].focus() } },
      }, [h('div', { key: 'header', className: 'dsh-codex-menu-label' }, 'How should actions be approved?'), ...modes.map(id => h('button', { key: id, type: 'button', role: 'menuitemradio', 'aria-checked': current === id, disabled: pending || !available.has(id), className: 'dsh-codex-menu-row', onClick: () => choose(id) }, [h('span', { key: 'icon', className: 'dsh-codex-permission-icon', 'aria-hidden': true }, permissionIcon(id)), h('span', { key: 'copy', className: 'dsh-codex-permission-copy' }, [h('span', { key: 'title' }, names[id]), h('small', { key: 'description' }, error ? 'Could not verify availability' : options === null ? 'Checking availability…' : !available.has(id) ? (id === 'auto' ? 'Enable Auto Authorization Review in experimental plugins' : 'Not available in this installation') : descriptions[id])]), current === id ? h('span', { key: 'check', 'aria-hidden': true }, '✓') : null])), error ? h('div', { key: 'error', role: 'alert', className: 'dsh-codex-menu-label' }, error) : null]), document.body) : null
      const dialog = confirm && createPortal ? createPortal(h('div', { className: 'dsh-codex-confirm-backdrop' }, h('div', { role: 'dialog', 'aria-modal': true, 'aria-label': `Enable ${names[confirm]}`, className: 'dsh-codex-confirm' }, [h('strong', { key: 'title' }, `Enable ${names[confirm]}?`), h('p', { key: 'body' }, confirm === 'danger-full-access' ? 'This allows the agent unrestricted access to files and commands.' : 'DeepSeek’s experimental reviewer checks supported tool calls using your current model. Allowed calls run with full access. Reviews can make mistakes and use additional tokens.'), h('div', { key: 'actions', className: 'dsh-codex-confirm-actions' }, [h('button', { key: 'cancel', type: 'button', onClick: () => setConfirm(null) }, 'Cancel'), h('button', { key: 'confirm', type: 'button', onClick: () => { void submit(confirm) } }, 'Enable')])])), document.body) : null
      return h(React.Fragment, null, [h('button', { key: 'trigger', type: 'button', ref: trigger, disabled: locked || pending, className: 'dsh-codex-model-trigger', 'aria-label': `Access mode, current: ${names[current] ?? current}`, 'aria-haspopup': 'menu', 'aria-expanded': open, onClick: show }, [h('span', { key: 'icon', 'aria-hidden': true }, permissionIcon(current)), h('span', { key: 'label' }, names[current] ?? current)]), popup, dialog])
    }

    // open the plugin manager from settings
    function PluginManagerSettings({ close, openManager }) {
      return h('div', { style: { padding: '16px 0' } }, h('button', { type: 'button', className: 'dsh-uideclutter-menuitem', onClick: () => { close(); openManager() } }, 'Open plugin manager'))
    }

    // install styles and disclosure motion
    function StyleHost() {
      useEffect(() => {
        const labelButtons = root => {
          if (!(root instanceof Element)) return
          const buttons = root.matches('button[data-turn-process]') ? [root] : root.querySelectorAll('button[data-turn-process]')
          for (const button of buttons) {
            const text = button.textContent?.trim()
            if (text?.startsWith('Completed in ')) button.setAttribute('aria-label', text.replace(/^Completed in /, 'Worked for '))
          }
        }
        labelButtons(document.body)
        const observer = new MutationObserver(records => { for (const record of records) { if (record.type === 'characterData') labelButtons(record.target.parentElement?.closest('button[data-turn-process]')); else for (const node of record.addedNodes) labelButtons(node) } })
        observer.observe(document.body, { childList: true, characterData: true, subtree: true })
        const onToggle = event => {
          const button = event.target instanceof Element ? event.target.closest('button[data-turn-process][aria-expanded="false"]') : null
          if (!button || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
          const row = button.closest('[class*="_flowItem"]')
          const flow = row?.parentElement
          if (!row || !flow) return
          const existing = new Set(flow.children)
          requestAnimationFrame(() => {
            if (button.getAttribute('aria-expanded') !== 'true' || !row.isConnected) return
            for (let node = row.nextElementSibling; node && !existing.has(node); node = node.nextElementSibling) {
              const height = node.getBoundingClientRect().height
              if (!height) continue
              const oldOverflow = node.style.overflow
              node.style.overflow = 'hidden'
              const animation = node.animate([{ height: '0px', opacity: 0 }, { height: `${height}px`, opacity: 1 }], { duration: 300, easing: 'cubic-bezier(.22,1,.36,1)' })
              animation.onfinish = animation.oncancel = () => { node.style.overflow = oldOverflow }
            }
          })
        }
        document.addEventListener('click', onToggle, true)
        return () => { observer.disconnect(); document.removeEventListener('click', onToggle, true); document.querySelectorAll('button[data-turn-process][aria-label^="Worked for "]').forEach(button => button.removeAttribute('aria-label')) }
      }, [])
      return h('style', null, STYLE_TEXT)
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.inject(['slots', 'layout'], scope => {
          scope.slots.inject('settings.section', () => scope.slots.register({
            name: 'settings.section', id: 'plugin-manager', order: 16,
            label: 'Plugin manager', inject: () => ({ openManager: () => scope.layout.selectPanel('plugins') }),
          }, PluginManagerSettings))
        })
        ctx.inject(['slots', 'modelDirectories', 'sessions', 'remote', 'remote.session'], scope => {
          scope.slots.inject('conversation.input.model', () => scope.slots.register({
            name: 'conversation.input.model', id: 'codex-model-picker', priority: -1000,
            inject: sessionId => {
              const directory = scope.modelDirectories.directoryFor(sessionId)
              const available = scope.sessions.subagentAddress(sessionId) === undefined
              return { available, directory: directory.store, load: () => { if (available) directory.load().catch(() => {}) }, select: selection => available ? directory.select(selection) : Promise.resolve(undefined) }
            },
          }, CodexModelSelect))
        })
        ctx.inject(['slots', 'sessions', 'remote', 'remote.session', 'remote.permissionPresets'], scope => {
          scope.slots.inject('conversation.input.permission', () => scope.slots.register({
            name: 'conversation.input.permission', id: 'codex-permission-picker', priority: -1000,
            inject: sessionId => ({
              loadCatalog: async () => { const result = await scope.remote.permissionPresets.catalog(); if (!result.ok) throw result.error; return result.value.options },
              select: async preset => { const session = scope.sessions.binding(sessionId)?.session; if (!session) throw new Error('Session unavailable'); const result = await session.command(`/permission ${preset}`); if (!result.ok || !result.value.matched) throw new Error('Permission switch failed') },
            }),
          }, CodexPermissionSelect))
        })

        ctx.effect(() => {
          let snapshot = null
          let timer = 0
          const clearSnapshot = () => {
            clearTimeout(timer)
            snapshot?.remove()
            snapshot = null
          }
          const beforeToggle = () => {
            clearSnapshot()
            if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
            const column = document.querySelector('[class*="_frame"] > [class*="_sidebarCol"]')
            const root = column?.querySelector('[data-slot="sidebar"] > [class*="_root"]')
            if (!(column instanceof HTMLElement) || !(root instanceof HTMLElement)) return
            if (root.className.includes('_collapsed')) return
            const width = root.getBoundingClientRect().width
            if (width < 1) return
            snapshot = root.cloneNode(true)
            snapshot.classList.add('dsh-sidebar-exit-snapshot')
            snapshot.style.width = `${width}px`
            snapshot.setAttribute('aria-hidden', 'true')
            snapshot.setAttribute('inert', '')
            snapshot.removeAttribute('id')
            snapshot.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'))
            const originals = root.querySelectorAll('*')
            const copies = snapshot.querySelectorAll('*')
            column.appendChild(snapshot)
            originals.forEach((node, index) => {
              if (node.scrollTop || node.scrollLeft) {
                copies[index].scrollTop = node.scrollTop
                copies[index].scrollLeft = node.scrollLeft
              }
            })
            timer = setTimeout(clearSnapshot, 400)
          }
          const onKey = (event) => {
            if (event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey && !event.repeat && event.key.toLowerCase() === 'b') beforeToggle()
          }
          const onClick = (event) => {
            if (event.target instanceof Element && event.target.closest('button[aria-label="Collapse sidebar"],button[aria-label="Open sidebar"]')) beforeToggle()
          }
          document.addEventListener('keydown', onKey, true)
          document.addEventListener('click', onClick, true)
          return () => {
            clearSnapshot()
            document.removeEventListener('keydown', onKey, true)
            document.removeEventListener('click', onClick, true)
          }
        })
        
        ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
          name: 'conversation.composer.dock',
          id: 'activity',
          order: 0,
          priority: -1000,
        }, Nothing))
        ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
          name: 'conversation.composer.dock',
          id: 'usage',
          order: 1,
          priority: -1000,
        }, Nothing))

        ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
          name: 'conversation.session.header.utilities',
          id: 'context-meter',
          order: 100,
          label: 'Context usage',
        }, ContextChip))

        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'declutter-styles',
          order: 0,
          label: 'UI Declutter styles',
        }, StyleHost))

        ctx.effect(() => {
          const onContextMenu = (event) => {
            if (!(event.target instanceof Element)) return
            const row = event.target.closest('[role="treeitem"]')
            if (row === null) return
            const trigger = row.querySelector('[aria-label^="Session actions for"],[aria-label^="Workspace actions for"]')
            if (!(trigger instanceof HTMLElement)) return
            event.preventDefault()
            trigger.click()
          }
          document.addEventListener('contextmenu', onContextMenu, true)
          return () => { document.removeEventListener('contextmenu', onContextMenu, true) }
        })

      },
    }
  },
})
