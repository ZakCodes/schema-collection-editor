import React from 'react';
import Markmirror from 'react-markmirror';

export default class Editor extends React.Component {
    render() {
        return (<Markmirror value={this.props.value} theme="dark" />);
    }
}
