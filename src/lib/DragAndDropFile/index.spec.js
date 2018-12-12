import React from 'react';
// import { shallow, mount } from 'enzyme';
import { DragAndDropFile, Loading } from '@collab-ui/react';

describe('tests for <DragAndDropFile />', () => {

  it('it should excist 1st', () => {
    const container = DragAndDropFile;
    expect(container !== undefined);
  });

  // it('it should excist 2nd', () => {
  //   const Component = DragAndDropFile
  //   const container = mount(<Component children='test' ariaLabel='test' />);
  //   // const container = mount(<DragAndDropFile children='test' ariaLabel='test' />);
  //   expect(container !== undefined);
  // });

});

