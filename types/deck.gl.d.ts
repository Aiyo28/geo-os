declare module '@deck.gl/react' {
  import React from 'react';

  interface DeckGLProps {
    layers?: any[];
    initialViewState?: any;
    viewState?: any;
    controller?: boolean | object;
    onViewStateChange?: (info: any) => void;
    getTooltip?: (info: any) => any;
    onClick?: (info: any) => void;
    onHover?: (info: any) => void;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }

  const DeckGL: React.ComponentType<DeckGLProps>;
  export default DeckGL;
}

declare module '@deck.gl/geo-layers' {
  export class H3HexagonLayer {
    constructor(props: any);
  }
}

declare module '@deck.gl/layers' {
  export class ScatterplotLayer {
    constructor(props: any);
  }

  export class IconLayer {
    constructor(props: any);
  }
}

declare module '@deck.gl/aggregation-layers' {
  export class HeatmapLayer {
    constructor(props: any);
  }
}