//go:build !no_runtime_type_checking

package layerborncdkamibuilder

import (
	"fmt"
)

func (j *jsiiProxy_IActionCommands) validateSetCommandsParameters(val *[]*string) error {
	if val == nil {
		return fmt.Errorf("parameter val is required, but nil was provided")
	}

	return nil
}

