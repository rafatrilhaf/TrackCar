import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors'; // Importar cores
import { theme } from '../constants/theme';

// Usar Colors.light ou Colors.dark conforme seu tema ou estado da aplicação
const colors = Colors.light;  // Exemplo: usar tema claro fixo

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: colors.primary,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: colors.background,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.fontSize.header,
    fontWeight: theme.fontWeight.bold,
    color: colors.text,
    marginLeft: theme.spacing.md,
  },
  menuIcon: {
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
});
