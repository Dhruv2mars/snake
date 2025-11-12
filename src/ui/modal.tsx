import React from 'react';
import {Box, Text} from 'ink';

export function Modal({title, children, width=44}:{title:string; children:React.ReactNode; width?:number}){
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="#64748b" padding={1} width={width}>
      <Text>{title}</Text>
      <Box height={1} />
      {children}
    </Box>
  );
}

