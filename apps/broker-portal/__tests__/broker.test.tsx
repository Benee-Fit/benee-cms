import { render } from '@testing-library/react';
import { expect, test } from 'vitest';

test('always passes', () => {
  const { container } = render(<div>Hello World!</div>);
  expect(container).toBeTruthy();
});
