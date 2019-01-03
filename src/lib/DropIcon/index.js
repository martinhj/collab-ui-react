import React from 'react';
import PropTypes from 'prop-types';
import { Button, Icon, ProgressBar, Spinner } from '@collab-ui/react';

/**
 * @category controls
 * @component dropicon
 * @variations collab-ui-react
 */

class DropIcon extends React.Component {
  static displayName = 'DropIcon';

  static defaultProps = {
    className: '',
    progress: 0.0,
    isDragOver: false,
    droppedFiles: [],
  }

  static propTypes = {
    /** @prop Append class name to Component | 0.0 */
    className: PropTypes.string,
    /** @prop Upload progress coefficient | 0.0 */
    progress: PropTypes.number,
    /** @prop true when upload is completed*/
    complete: PropTypes.bool,
    /** @prop List of files, containing name, type and size */
    droppedFiles: PropTypes.array,
    /** @prop True if there is something being dragged over the drop area */
    isDragOver: PropTypes.bool,
    /** @prop Function that is called when file is accepted and is uploading */
    completed: PropTypes.bool,
    /** @prop Function that is called when file uplode is completed */
    onComplete: PropTypes.func,
    /** @prop Function that is called on click on 'cancel' button */
    onCancelClick: PropTypes.func,
    /** @prop Function that is called on click on 'remove' button */
    onRemoveClick: PropTypes.func,
    /** @prop Function that is called on click on 'replace' button */
    onReplaceClick: PropTypes.func,
  }

  render() {
    const {
      className,
      progress,
      onCancelClick,
      onRemoveClick,
      onReplaceClick,
      droppedFiles,
      complete,
      isDragOver
    } = this.props;

    const file = droppedFiles.length > 0 ? droppedFiles[0] : null;
    const filename = file ? file.name : '';
    const fileiconName = file ? getFileIcon(file.type) : '';

    const dropHere = (
      <div className={`
        dropicon__dialog
        dropicon__dialog--default
        ${isDragOver ? ' dropicon__dialog--is-drag-over' : ''}
      `}>
        <Icon className={`dropicon__icon`} name="icon-upload_36" />
        <span className={`
          dropicon__caption
          dropicon__caption--default
          ${isDragOver ? ' dropicon__caption--is-drag-over' : ''}
        `}>
          Drag an image here, or click to upload
        </span>
      </div>
    );

    const processing = (
      <div className="dropicon__dialog">
        <Spinner className="dropicon__icon" />
        <div className="dropicon__caption dropicon__caption--processing">
          Processing...
        </div>
      </div>
    );

    const uploading = (
      <div className="dropicon__dialog">
        <Icon
          className="dropicon__icon"
          name={fileiconName}
        />
        <div className="dropicon__caption">
          {filename}
        </div>
        <div className={`dropicon__progress`}>
          <div className={`dropicon__progress-bar`}>
            <ProgressBar
              label=''
              min={0}
              max={100}
              value={100 * this.props.progress}
              displayFormat='none'
            />
          </div>
          {onCancelClick
          ? <div className={`dropicon__cancel-button`}>
              <Icon
                ariaLabel='Cancel file uploade'
                name='icon-clear_14'
                className={`dropicon__uploading--cancel`}
                onClick={onCancelClick}
              />
            </div>
          : null}
        </div>
      </div>
    );

    const completeComponent = (
      <div className="dropicon__dialog">
        <Icon
          size={32}
          className="dropicon__icon dropicon__icon--complete"
          name={fileiconName}
        />
        <span className="dropicon__caption">
          {filename}
        </span>
        <div className="dropicon__buttons">
          <Button
            ariaLabel='Remove uploaded file'
            color='red'
            size={28}
            onClick={(event) => onRemoveClick(event)}
          >
            Remove
          </Button>
          <Button
            ariaLabel='Replace uploaded file'
            size={28}
            onClick={(event) => onReplaceClick(event)}
          >
            Replace
          </Button>
        </div>
      </div>
    );

    const activeComponent = () => {
      switch (true) {
        case complete: return completeComponent;
        case progress > 0.0: return uploading; // progress={this.props.progress * 100} filename={filename} /;
        case droppedFiles.length > 0: return processing;
        default: return dropHere;
      }
    };

    return (
      <div className={'dropicon ' + className}>
        {activeComponent()}
      </div>
    );

  }
}

export default DropIcon;

const getFileIcon = (contentType) => {
  switch(contentType) {
    case 'image/png':
    case 'image/jpeg': return 'icon-file-image_32';
    case 'application/pdf': return 'icon-file-pdf_32';
    // case 'invalid': return 'icon-broken-file_24';  // broken-file at size 32 does not exist
    default: return 'icon-file-missing_32';
  }
};

/**
* @component dropicon
* @section default
* @react
 import { DropIcon } from '@collab-ui/react';

 export default function DropIconDefault() {
   return(
      <DropIcon {...props} />
    );
 }
**/

/**
* @component dropicon
* @section full
* @react
 import { DropIcon } from '@collab-ui/react';

 export default class DropIconDefault extends React.Component {
    state = {
      uploadFileId: undefined,
    }

    onCancel = () => {
      this.setState({ uploadFileId: null };
    }

    onComplete = (response) => {
      this.setState({ uploadFileId: response.data.fileId });
    }

   render() {
     return(
        <DropIcon
          {...props}
          onRemoveClick={(event) => {
            props.reset(event);
            this.onCancel();
          }}
          onReplaceClick={props.reset}
          onCancelClick={(event) => {
            console.log(`- cancel -`) // call axios cancel from here...
            // we need to:
            // props.reset(event);
            // after upload is canceled
            event.stopPropagation();
          }}
        />
      );
   }
 }
**/
