import React from 'react';
import {Box, Text} from 'ink';

export function Modal({title, children, width=44, borderColor="#64748b"}:{title:string; children:React.ReactNode; width?:number; borderColor?:string}){
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={borderColor} padding={1} width={width}>
      <Text>{title}</Text>
      <Box height={1} />
      {children}
    </Box>
  );
}
