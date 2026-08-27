import React, { type ReactNode, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { typography } from '../../theme/typography';
import { haptics } from '../../utils/helpers';

const MINT = '#34D399';
const MINT_RING = 'rgba(52,211,153,0.55)';
const HAIRLINE = 'rgba(255,255,255,0.1)';

interface CleanAuthInputProps extends TextInputProps {
  iconName?: keyof typeof MaterialIcons.glyphMap;
  iconNode?: ReactNode;
  rightNode?: ReactNode;
  error?: string;
}

export function CleanAuthInput({
  iconName,
  iconNode,
  rightNode,
  error,
  onFocus,
  onBlur,
  ...props
}: CleanAuthInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.block}>
      <View
        style={[
          styles.container,
          focused && styles.containerFocused,
          error ? styles.containerError : null,
        ]}
      >
        {iconNode ? (
          iconNode
        ) : iconName ? (
          <View style={styles.iconWrap}>
            <MaterialIcons
              name={iconName}
              size={19}
              color={focused ? MINT : '#8D9B92'}
            />
          </View>
        ) : null}

        <TextInput
          placeholderTextColor="rgba(141,155,146,0.65)"
          selectionColor={MINT}
          style={styles.input}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />

        {rightNode}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function CleanPasswordInput(props: CleanAuthInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <CleanAuthInput
      {...props}
      iconName="lock"
      secureTextEntry={!visible}
      rightNode={
        <Pressable
          onPress={() => {
            haptics.light();
            setVisible((v) => !v);
          }}
          style={styles.eyeBtn}
          hitSlop={8}
        >
          <MaterialIcons
            name={visible ? 'visibility-off' : 'visibility'}
            size={19}
            color="#8D9B92"
          />
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 4,
    marginBottom: 12,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: HAIRLINE,
    paddingHorizontal: 14,
    gap: 10,
  },
  containerFocused: {
    backgroundColor: 'rgba(20,32,25,0.75)',
    borderColor: MINT,
    shadowColor: MINT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 3,
  },
  containerError: {
    borderColor: 'rgba(239,68,68,0.6)',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: 'Inter_400Regular',
    fontSize: 14.5,
    color: '#F5F7F6',
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 4,
  },
  errorText: {
    ...typography.caption,
    fontSize: 12,
    color: '#F87171',
    marginLeft: 4,
  },
});
