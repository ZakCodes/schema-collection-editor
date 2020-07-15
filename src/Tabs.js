import React from 'react';
import {basename} from 'path';

class Tabs extends React.Component {
    onSelect = (index) => {
        if (this.props.onSelect)
            this.props.onSelect(index);
    }
    onClose = (index) => {
        if (this.props.onClose)
            this.props.onClose(index);
    }

    render() {
        let untitledIndex = 0;
        let tabs = this.props.tabs.map((file, index) => {
            let title = null;
            let name;
            if (file.path) {
                title = file.path;
                name = basename(file.path);
            } else {
                name = "Untitled " + untitledIndex;
                untitledIndex++;
            }

            let className = "tab";
            if (index === this.props.index)
                className += " selected";

            return (
                <div className={className} title={title}>
                    <button onClick={() => this.onClose(index)} 
                            className="close-btn">
                        <i className="glyphicon glyphicon-remove"/>
                    </button>
                    <button onClick={() => this.onSelect(index)}
                            className="select">
                        {name}
                    </button>
                </div>
            );
        });
        return (
            <div className="tabs">
                {tabs}
            </div>
        );
    }
}

export default Tabs;
