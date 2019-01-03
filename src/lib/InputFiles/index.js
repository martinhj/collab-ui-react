import React from 'react';
import PropTypes from 'prop-types';

/**
 * @category containers
 * @component inputfiles
 * @variations collab-ui-react
 */

class UploadFile extends React.Component {
  static displayName = 'UploadFile'

  static defaultProps = {
    className: '',
    multiple: false,
    tabIndex: 0,
  }

  static propTypes = {
    /** @prop Function that is called with a array of files to be uploaded */
    upload: PropTypes.func.isRequired,
    /** @prop Function to render the information from this component */
    render: PropTypes.func.isRequired,
    /** @prop to set an additional class name for this component */
    className: PropTypes.string,
    /** @prop Sets the file types possible to select in the file input form according to https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#Unique_file_type_specifiers */
    accept: PropTypes.string,
    /** @prop Sets if it is possible to upload more than one file from the input form*/
    multiple: PropTypes.bool,
    /** @prop Function that is called on file selected */
    onDrop: PropTypes.func,
    /** @prop Function that is called when upload is done with the response from the upload function*/
    onComplete: PropTypes.func,
    /** @prop Function that is called when a upload is regarded as invalid */
    onInvalidUpload: PropTypes.func,
    /** @prop Set tabindex for input file field | 0 */
    tabIndex: PropTypes.number,
    /** @prop async Function that is used to validate a file before it is uploaded */
    validateFileUpload: PropTypes.func,
    /** @prop Function */
    progress: PropTypes.func,
  }

  state = {
    progress: 0.0,
    complete: false,
    droppedFiles: [],
    isDragOver: false,
  }

  componentDidMount() {
    this.dragTargets = [];
  }

  inputRef = React.createRef();

  getInputElem = () => this.inputRef.current ? this.inputRef.current : undefined

  async validateFileUpload(files) {
    try {
      if (!this.props.validateFileUpload) return true;
      return await this.props.validateFileUpload(files);
    } catch (e) {
      throw e;
    }
  }

  onClick = () => {
    if (!this.shouldInputBeEnabled()) return;
    this.open();
  }

  onKeyPress = () => {
    if (!this.shouldInputBeEnabled()) return;
    this.open();
  }

  open = () => {
    this.getInputElem().click();
  }

  reset = () => {
    this.setState({
      progress: 0.0,
      droppedFiles: [],
      complete: false,
      isDragOver: false,
    });
  }

  resetButton = (event) => {
    this.reset();
    event.stopPropagation();
  }

  onInvalidUpload = (e) => {
    this.reset();
    if (this.props.onInvalidUpload) return this.props.onInvalidUpload(e);
  }

  progress = (progress) => {
    this.props.progress && this.props.progress(progress);
    this.setState({ progress });
  };

  complete = (response) => {
    this.props.onComplete && this.props.onComplete(response);
    this.setState({ complete: true });
  };

  upload = (files) => this.props.upload(files, this.progress, this.complete)
    .then(response => {
      this.complete(response);
    });

  onFiles = async (files) => {
    if (!files || !files.length) throw Error(`Invalid file dropped`);
    if (!this.shouldInputBeEnabled()) return;
    this.setState({ droppedFiles: files });

    try {
      await this.validateFileUpload(files);
      await this.upload(files, this.progress);
    } catch (e) {
      this.onInvalidUpload(e);
      return;
    }
  }

  extractFiles(files) {
    return Array.from(files);
  }

  countDragAreaChildren(target) {
    if (!this.dragTargets.includes(target)) this.dragTargets.push(target);
  }

  subractDragAreaChildren(target) {
    this.dragTargets = this.dragTargets.filter((elem) => elem !== target);
  }

  isWholeDragAreaLeft() {
    if (this.dragTargets.length < 1) return true;
    return false;
  }

  onDrop = (event) => {
    event.persist();
    event.preventDefault();

    if (!this.shouldInputBeEnabled()) return;
    if (!event || !event.dataTransfer || !event.dataTransfer.files)
      throw Error(`Invalid file dropped (onDrop event.dataTransfer.files)`);

    if (this.props.onDrop) this.props.onDrop(event);

    const files = this.extractFiles(event.dataTransfer.files);
    this.onFiles(files);

    this.setState(state => {
      if (state.isDragOver)
        return {isDragOver: false};
    });
  }

  onAdd = (event) => {
    if (!event || !event.target || !event.target.files)
      throw Error(`Invalid file dropped (onAdd event.target.files)`);
    if (!this.shouldInputBeEnabled()) return;
    const files = this.extractFiles(event.target.files);
    this.onFiles(files);
  }

  onDragEnter = (event) => {
    event.stopPropagation();
    event.preventDefault();

    if (!this.shouldInputBeEnabled()) return;

    this.countDragAreaChildren(event.target);

    this.setState(state => {
      if (!state.isDragOver)
        return ({isDragOver: true});
    });
  }

  onDragLeave = (event) => {
    event.preventDefault();
    event.persist();

    this.subractDragAreaChildren(event.target);

    if (!this.isWholeDragAreaLeft()) return;

    this.setState(state => {
      if (state.isDragOver)
        return {isDragOver: false};
    });
  }

  onDragOver = (event) => {
    event.stopPropagation();
    event.preventDefault();
  }

  onDragEnd = (event) => {
    event.stopPropagation();
    event.preventDefault();
    this.setState(state => {
      if (state.isDragOver)
        return {isDragOver: false};
    });
  }

  shouldInputBeEnabled = () => {
    const { complete, progress, droppedFiles } = this.state;
    switch (true) {
      case complete:
      case progress > 0.0:
      case droppedFiles.length > 0: return false;
      default: return true;
    }
  }

  render() {
    const { render, multiple, tabIndex, accept, ...props } = this.props;
    this.dragTargets = [];

    return (
      <div
        className={'input-files-field ' + this.props.className}
        onClick={(event) => this.onClick(event)}
        role="button"
        tabIndex={tabIndex}
        onKeyDown={(event) => this.onKeyPress(event)}
        onDragOver={this.onDragOver}
        onDragEnter={this.onDragEnter}
        onDragLeave={this.onDragLeave}
        onDragEnd={this.onDragEnd}
        onDrop={this.onDrop}
      >
        <input
          ref={this.inputRef}
          type="file"
          style={{display: 'none'}}
          accept={accept}
          multiple={multiple}
          onChange={(event) => this.onAdd(event)}
        />
        {render({
          ...this.state,
          ...props,
          reset: this.resetButton,
        })}
      </div>
    );
  }
}

export default UploadFile;

/**
* @category containers
* @component inputfiles
* @section default
* @react
 import { InputFiles } from '@collab-ui/react';

 export default function InputFilesDefault() {
   return(
     <InputFiles
       upload={upload}
       render={(props) => <DragAndDropComponent {...props} />}
     />
    );
 }
**/

/* Browser upload function example:
 * Pass in the this.progress method to your upload function and call it with the
 * progress coefficient (0.0-1.0)

  const upload = (file, progressCallback) => {
    const formdata = new FormData()
    fd.append('aFile', file)

    axios.request({
      method: 'POST',
      data: formdata,
      url: 'http://localhost:4000/upload',
      onUploadProgress: (progress) => {
        progressCallback(progress.loaded / progress.total)
      }
    })
  }
*/
