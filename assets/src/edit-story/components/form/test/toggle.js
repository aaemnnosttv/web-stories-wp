/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import { render, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

/**
 * Internal dependencies
 */
import theme from '../../../theme';
import { Toggle } from '../';

function arrange(children = null) {
  return render(<ThemeProvider theme={theme}>{children}</ThemeProvider>);
}

describe('Form/Toggle', () => {
  it('should render <Toggle /> form', () => {
    const onChangeMock = jest.fn();

    const { getByTestId } = arrange(
      <Toggle value={0} onChange={onChangeMock} data-testid="toggle" />
    );

    const input = getByTestId('toggle');

    expect(input).toBeDefined();
  });

  it('should simulate a change on <Toggle />', () => {
    const onChangeMock = jest.fn();

    const { getByTestId } = arrange(
      <Toggle
        value={1}
        checked={false}
        onChange={onChangeMock}
        data-testid="toggle"
      />
    );

    const toggle = getByTestId('toggle');

    expect(toggle.checked).toStrictEqual(false);

    fireEvent.change(toggle, { target: { checked: 'checked' } });

    expect(toggle.checked).toStrictEqual(true);
  });
});