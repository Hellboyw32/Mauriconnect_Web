import PropTypes from 'prop-types';
import type { FC } from 'react';

import { FileIcon } from 'src/components/file-icon';

interface DocumentIconProps {
  extension?: string;
}

export const DocumentIcon: FC<DocumentIconProps> = (props) => {
  const { extension } = props;

  return <FileIcon extension={extension} />;
};

DocumentIcon.propTypes = {
  extension: PropTypes.string
};
