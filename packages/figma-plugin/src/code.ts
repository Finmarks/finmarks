figma.showUI(__html__, { width: 400, height: 560, themeColors: true });

figma.ui.onmessage = msg => {
  if (msg.type === 'insert-svg') {
    try {
      const node = figma.createNodeFromSvg(msg.svg);
      node.name = msg.name;
      
      let targetContainer: (BaseNode & ChildrenMixin) | null = null;
      if (figma.currentPage.selection.length > 0) {
        const selected = figma.currentPage.selection[0];
        if ('appendChild' in selected && selected.type !== 'PAGE') {
          targetContainer = selected as (BaseNode & ChildrenMixin);
        } else if (selected.parent && 'appendChild' in selected.parent && selected.parent.type !== 'PAGE') {
          targetContainer = selected.parent as (BaseNode & ChildrenMixin);
        }
      }

      if (targetContainer) {
        targetContainer.appendChild(node);
        
        // If not auto-layout, center inside the container
        if (!('layoutMode' in targetContainer) || (targetContainer as FrameNode).layoutMode === 'NONE') {
          node.x = ((targetContainer as FrameNode).width - node.width) / 2;
          node.y = ((targetContainer as FrameNode).height - node.height) / 2;
        }
      } else {
        // Place the node in the center of the current view on canvas
        node.x = figma.viewport.center.x - node.width / 2;
        node.y = figma.viewport.center.y - node.height / 2;
        figma.currentPage.appendChild(node);
        figma.viewport.scrollAndZoomIntoView([node]);
      }
      
      figma.currentPage.selection = [node];
      
    } catch (e) {
      figma.notify('Error inserting SVG: ' + e);
    }
  }
};
