'use client';
import { useState } from 'react';
import { IconButton, InputAdornment, Tooltip } from '@mui/material';
import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react';
import type { FieldValues } from 'react-hook-form';
import { FormTextField, type FormTextFieldProps } from './form-text-field';
export function FormPasswordField<T extends FieldValues>(
  props: Omit<FormTextFieldProps<T>, 'type' | 'slotProps'>,
) {
  const [visible, setVisible] = useState(false);
  const label = visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu';
  return (
    <FormTextField
      {...props}
      type={visible ? 'text' : 'password'}
      slotProps={{
        htmlInput: { maxLength: 128 },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={label}>
                <IconButton
                  type="button"
                  aria-label={`${label}: ${props.label}`}
                  aria-pressed={visible}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setVisible((value) => !value)}
                >
                  {visible ? (
                    <EyeSlashIcon size={20} aria-hidden="true" />
                  ) : (
                    <EyeIcon size={20} aria-hidden="true" />
                  )}
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
