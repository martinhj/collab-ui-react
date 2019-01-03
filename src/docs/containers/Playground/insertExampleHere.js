import React from 'react';
import ErrorBoundary from '@collab-ui/react/ErrorBoundary';
import ErrorContainer from '../ErrorContainer';

import DropIcon from '../../../lib/DropIcon';
import InputFiles from '../../../lib/InputFiles';

export default class PlaygroundComponent extends React.Component {
  state = {
    uploadFileId: undefined,
  }

  onCancel = () => {
    this.setState({ uploadFileId: null }, () => console.log(`parent current state (after cancel):`, this.state));
  }

  onComplete = (response) => {
    this.setState(
      { uploadFileId: response.data.fileId }
    );
  }

  onInvalidUpload = (e) => {
    console.error(`got error from upload():`, e);
  }

  render() {
    // If this was inside a <form>:
    // if (this.state.uploadFileId) insertFileIdToHiddenFileForm(this.state.uploadFileId);
    // if (!this.state.uploadFileId) disableSubmitButton();

    return (
      <div
        className="dragndrop-parent"
        style={{height: '156px'}}
      >
        <ErrorBoundary fallbackComponent={<ErrorContainer />}>
          <InputFiles
            upload={_upload}
            validateFileUpload={_validate}
            onComplete={this.onComplete}
            onCancel={this.onCancel}
            onInvalidUpload={this.onInvalidUpload}
            render={(props) => (
              <DropIcon
                {...props}
                onRemoveClick={(event) => {
                  props.reset(event);
                  this.onCancel();
                }}
                onReplaceClick={props.reset}
                onCancelClick={(event) => {
                  console.log(`- "canceling" (I'm really not...)-`);
                  event.stopPropagation();
                }}
              />
            )}
          />
        </ErrorBoundary>
      </div>
    );
  }
}

const _validate = async (files) => {
  await _sleep(900);
  return true;
}

const _upload = async (files, progressCallback) => {
  await _simulateProgress(progressCallback);
  return {data: {success: true, fileId: "123123"}};
}

const _simulateProgress = async (progressCallback) => {
  for (let i = 1.0; i <= 10.0; i++) {
    await _sleep(200);
    progressCallback(i/10);
  }
}

const _sleep = (ms) =>  {
  return new Promise(resolve => setTimeout(resolve, ms));
}
