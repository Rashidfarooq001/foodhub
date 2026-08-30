import React from 'react';
import { Modal, ModalProps } from './modal.js';

export const Dialog: React.FC<ModalProps> = (props) => {
  return <Modal {...props} />;
};
