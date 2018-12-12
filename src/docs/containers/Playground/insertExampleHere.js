import React from 'react';
import ErrorBoundary from '@collab-ui/react/ErrorBoundary';
import ErrorContainer from '../ErrorContainer';

import { DragAndDropFile } from '@collab-ui/react';

export default class PlaygroundComponent extends React.Component {
  render() {
    return (
      <ErrorBoundary fallbackComponent={<ErrorContainer />}>
        <DragAndDropFile
          ariaLabel="A playground dragndrop field"
          filenameCaption="Filename.pdf"
        >
          Playground dragndrop
        </DragAndDropFile>
      </ErrorBoundary>
    );
  }
}
