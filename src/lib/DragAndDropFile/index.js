import React from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup, Icon, ProgressBar } from '@collab-ui/react';

/**
 * @category controls
 * @component draganddropfile
 * @variations collab-ui-react
 */

class DragAndDropFile extends React.Component {
  static displayName = 'DragAndDropFile';

  static defaultProps = {
    label: '',
    ariaLabel: '',
    className: '',
    onClick: null,
  }

  static propTypes = {
    /** @prop Text with title | '' */
    label: PropTypes.string,
    /** @prop Text to display for blindness accessibility features | '' */
    ariaLabel: PropTypes.string,
    /** @prop Optional css class string | '' */
    className: PropTypes.string,
    /** @prop Sets the attribute disabled to the button | false */
    onClick: PropTypes.func,
    /** @prop Sets the attribute disabled to the button | false */
    children: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.string
    ])
  }

  state = {
    uploading: false,
    progress: 0.0,
    complete: false,
    // processingCaption: 'processing',
    processingCaption: 'uploading',
    filenameCaption: '',
    type: 'uploading'
  }

  render() {
    const {
      label,
      children,
      ariaLabel,
      className,
      onClick,
      name,
      filenameCaption,
      processingCaption
    } = this.props;
    const _className = 'draganddrop';


    const Default = () => (
      <div className={`${_className}--icon-container`}>
        <Icon className="draganddrop--default__file-icon" name="icon-upload_36" />
        <span className="draganddrop--default__caption">Drag an image here, or click to upload</span>
      </div>
    );

    const Processing = ({ caption }) => (
      <div className="dranganddrop--processing">
        <Icon className="dranganddrop--processing__icon" name="icon-spinner_80" />
        <span className={`${_className}--caption draganddrop--processing__caption`}>{caption}</span>
      </div>
    );

    const Uploading = ({ progress, filenameCaption }) => (
      <span className={`${_className}--uploading`}>
        <Icon className={`${_className}--uploading__icon`} name="icon-file-pdf_32" />
        <span className={`${_className}--caption ${_className}--uploading__caption`}>{filenameCaption}</span>
        <div className={`${_className}--uploading__progress`}>
          <div className={`${_className}--uploading__progress-bar`}>
            <ProgressBar
              label=''
              min={0}
              max={100}
              value={progress}
              displayFormat='none'
            />
          </div>
          <div className="draganddrop--uploading__progress-cancel-button">
            <Icon
              ariaLabel='Cancel file uploade'
              name='icon-clear_14'
              className="dranganddrop--uploading__cancel"
              onClick={() => cancelClickHandler()}
            />
          </div>
        </div>
      </span>
    );

    const Complete = ({ filenameCaption, cancelClickHandler }) => (
      <span className="dranganddrop--complete">
        <Icon className="dranganddrop--uploading__icon" name="icon-file-pdf_72" />
        <span className="`${_className}--caption draganddrop--complete__caption">{filenameCaption}</span>
        <div className="draganddrop--complete__actions">
          <ButtonGroup>
            <Button
              ariaLabel='Remove uploaded file'
              className="dranganddrop--loading__remove .cui-button--red"
              onClick={ () => removeClickHandler() }
            >
              Remove
            </Button>
            <Button
              ariaLabel='Replace uploaded file'
              className="dranganddrop--loading__replace .cui-button"
              onClick={ () => replaceClickHandler() }
            >
              Replace
            </Button>
          </ButtonGroup>
        </div>
      </span>
    );

    const activeComponent = (type) => {
      switch (type) {
        case 'processing': return (<Processing caption={processingCaption} />);
        case 'uploading': return (<Uploading progress={40} filenameCaption={filenameCaption} />);
        case 'complete': return (<Complete filenameCaption={filenameCaption} />);
        default: return (<Default />);
      }
    }

    return (
      <div className={`${_className}`}>
        {activeComponent(this.state.type)}
      </div>
    );

  }
}

export default DragAndDropFile;

/**
* @component draganddropfile
* @section default
* @react
 import { DragAndDropFile  } from '@collab-ui/react';

 export default function DragAndDropDefault() {
   return(
      <DragAndDropFile
        name='default drag and drop ...'
        label='A drag and drop field'
        children='A minimal children'
      />
    );
 }
**/
