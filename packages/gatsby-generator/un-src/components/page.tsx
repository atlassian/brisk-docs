import styled from '@emotion/styled';
import { gridSize, math } from '@atlaskit/theme';

const containerWidth = {
  small: '480px',
  medium: '640px',
  large: '980px',
};

const PageContainer = styled.main`
  max-width: ${(p: { width?: 'small' | 'medium' | 'large' }) =>
    p.width ? containerWidth[p.width] : containerWidth.large};
  margin: 2rem auto;
  padding: 0 ${math.multiply(gridSize, 5)}px;
`;

export default PageContainer;

export const Title = styled.h1`
  margin-bottom: 1em;
`;

export const Section = styled.section`
  margin-top: 3em;

  p {
    line-height: 1.4em;
  }
`;

export const Intro = styled.p`
  font-size: ${math.multiply(gridSize, 2)}px;
  font-weight: 300;
  line-height: 1.4em;
`;
