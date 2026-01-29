import type { ThemeConfig } from 'antd';
import {theme as antdTheme} from 'antd';


export const theme: ThemeConfig = {
    algorithm: antdTheme.darkAlgorithm,
    token: {
        colorPrimary: '#0a416a',
        borderRadius: 4,

        fontSize: 14,              // Base font size
        fontSizeHeading1: 38,      // h1
        fontSizeHeading2: 30,      // h2
        fontSizeHeading3: 24,      // h3
        fontSizeHeading4: 20,      // h4
        fontSizeHeading5: 16,      // h5

        
        // Font weights
        fontWeightStrong: 600,     // Bold text
        
        // Line heights
        lineHeight: 1.5715,
        lineHeightHeading1: 1.21,
        lineHeightHeading2: 1.27,
        lineHeightHeading3: 1.33,
      },
}